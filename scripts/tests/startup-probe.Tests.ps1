$modulePath = Join-Path $PSScriptRoot '..\lib\startup-probe.psm1'
Import-Module $modulePath -Force

Describe 'Startup probe lifecycle' {
    InModuleScope startup-probe {
        BeforeAll {
            function New-TestDockerResult {
                param(
                    [bool]$Success,
                    [int]$ExitCode = 0,
                    [string]$StdOut = '',
                    [string]$StdErr = ''
                )
                [pscustomobject]@{
                    Success = $Success
                    ExitCode = $ExitCode
                    StdOut = $StdOut
                    StdErr = $StdErr
                    Output = ($StdOut + $StdErr)
                }
            }
        }

        BeforeEach {
            Mock Write-Host {}
            Mock Write-Warning {}
        }

        It 'treats an absent probe as an idempotent cleanup success' {
            Mock Invoke-ContabilidadeDocker {
                New-TestDockerResult -Success $false -ExitCode 1 -StdErr 'Error response from daemon: No such container: contabilidade-startup-probe'
            }

            $result = Remove-ContabilidadeStartupProbe
            $result.Success | Should -BeTrue
            $result.Category | Should -Be 'CONTAINER_ABSENT_EXPECTED'
        }

        It 'removes a stopped owned probe and verifies absence' {
            $script:inspectCount = 0
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'inspect') {
                    $script:inspectCount++
                    if ($script:inspectCount -eq 1) {
                        return New-TestDockerResult -Success $true -StdOut "id-stopped|exited|true`n"
                    }
                    return New-TestDockerResult -Success $false -ExitCode 1 -StdErr 'No such container: probe'
                }
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'rm') {
                    $Arguments[-1] | Should -Be 'id-stopped'
                    return New-TestDockerResult -Success $true -StdOut "id-stopped`n"
                }
                throw "Unexpected Docker call: $($Arguments -join ' ')"
            }

            $result = Remove-ContabilidadeStartupProbe
            $result.Category | Should -Be 'CONTAINER_REMOVED'
            $result.ContainerId | Should -Be 'id-stopped'
        }

        It 'removes a running owned probe by immutable container ID' {
            $script:inspectCount = 0
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'inspect') {
                    $script:inspectCount++
                    if ($script:inspectCount -eq 1) {
                        return New-TestDockerResult -Success $true -StdOut "id-running|running|true`n"
                    }
                    return New-TestDockerResult -Success $false -ExitCode 1 -StdErr 'No such container: probe'
                }
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'rm') {
                    $Arguments[-1] | Should -Be 'id-running'
                    return New-TestDockerResult -Success $true -StdOut "id-running`n"
                }
                throw "Unexpected Docker call: $($Arguments -join ' ')"
            }

            $result = Remove-ContabilidadeStartupProbe
            $result.Category | Should -Be 'CONTAINER_RUNNING_REMOVED'
        }

        It 'treats disappearance between inspect and remove as a concurrent benign race' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'inspect') {
                    return New-TestDockerResult -Success $true -StdOut "id-race|running|true`n"
                }
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'rm') {
                    return New-TestDockerResult -Success $false -ExitCode 1 -StdErr 'Error response from daemon: No such container: id-race'
                }
                throw "Unexpected Docker call: $($Arguments -join ' ')"
            }

            $result = Remove-ContabilidadeStartupProbe
            $result.Success | Should -BeTrue
            $result.Category | Should -Be 'CONCURRENT_REMOVAL_EXPECTED'
        }

        It 'refuses to remove a same-name container with a foreign label' {
            Mock Invoke-ContabilidadeDocker {
                New-TestDockerResult -Success $true -StdOut "foreign-id|running|false`n"
            }

            { Remove-ContabilidadeStartupProbe } |
                Should -Throw '*PROBE_NAME_OWNERSHIP_CONFLICT*'
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 0 -ParameterFilter {
                $Arguments[0] -eq 'container' -and $Arguments[1] -eq 'rm'
            }
        }

        It 'keeps a real remove failure red' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'inspect') {
                    return New-TestDockerResult -Success $true -StdOut "owned-id|running|true`n"
                }
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'rm') {
                    return New-TestDockerResult -Success $false -ExitCode 13 -StdErr 'permission denied'
                }
                throw "Unexpected Docker call: $($Arguments -join ' ')"
            }

            { Remove-ContabilidadeStartupProbe } |
                Should -Throw '*PROBE_REMOVE_FAILED*DOCKER_PERMISSION_OR_API_FAILURE*'
        }

        It 'creates a labeled probe on the first execution' {
            $script:probeExists = $false
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                $joined = $Arguments -join ' '
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'inspect') {
                    if ($script:probeExists) {
                        return New-TestDockerResult -Success $true -StdOut "new-id|running|true`n"
                    }
                    return New-TestDockerResult -Success $false -ExitCode 1 -StdErr 'No such container: probe'
                }
                if ($Arguments[0] -eq 'compose' -and $Arguments -contains 'run') {
                    $joined | Should -Match '--label contabilidade.local.startup-probe=true'
                    $script:probeExists = $true
                    return New-TestDockerResult -Success $true -StdOut "new-id`n"
                }
                throw "Unexpected Docker call: $joined"
            }

            $result = Start-ContabilidadeStartupProbe -ComposePrefix @('compose', '--project-name', 'test')
            $result.Category | Should -Be 'PROBE_RUNNING'
            $result.ContainerId | Should -Be 'new-id'
        }

        It 'supports two repeated starts without an orphan or name conflict' {
            $script:probeExists = $false
            $script:containerSequence = 0
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                $joined = $Arguments -join ' '
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'inspect') {
                    if ($script:probeExists) {
                        return New-TestDockerResult -Success $true -StdOut "id-$script:containerSequence|running|true`n"
                    }
                    return New-TestDockerResult -Success $false -ExitCode 1 -StdErr 'No such container: probe'
                }
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'rm') {
                    $script:probeExists = $false
                    return New-TestDockerResult -Success $true -StdOut "removed`n"
                }
                if ($Arguments[0] -eq 'compose' -and $Arguments -contains 'run') {
                    $script:containerSequence++
                    $script:probeExists = $true
                    return New-TestDockerResult -Success $true -StdOut "id-$script:containerSequence`n"
                }
                throw "Unexpected Docker call: $joined"
            }

            $first = Start-ContabilidadeStartupProbe -ComposePrefix @('compose')
            $second = Start-ContabilidadeStartupProbe -ComposePrefix @('compose')

            $first.ContainerId | Should -Be 'id-1'
            $second.ContainerId | Should -Be 'id-2'
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1 -ParameterFilter {
                $Arguments[0] -eq 'container' -and $Arguments[1] -eq 'rm'
            }
        }

        It 'reports a real probe create failure' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                $joined = $Arguments -join ' '
                if ($Arguments[0] -eq 'container' -and $Arguments[1] -eq 'inspect') {
                    return New-TestDockerResult -Success $false -ExitCode 1 -StdErr 'No such container: probe'
                }
                if ($Arguments[0] -eq 'compose' -and $Arguments -contains 'run') {
                    return New-TestDockerResult -Success $false -ExitCode 125 -StdErr 'permission denied'
                }
                throw "Unexpected Docker call: $joined"
            }

            { Start-ContabilidadeStartupProbe -ComposePrefix @('compose') } |
                Should -Throw '*PROBE_CREATE_FAILED*'
        }

        It 'executes cleanup when the operation fails and preserves the primary failure' {
            $script:cleanupCalled = 0
            {
                Invoke-ContabilidadeWithProbeCleanup `
                    -Operation { throw 'primary failure' } `
                    -Cleanup {
                        $script:cleanupCalled++
                        New-ContabilidadeStartupProbeResult -Name 'probe' -Category 'CONTAINER_ABSENT_EXPECTED' -Success $true
                    }
            } | Should -Throw '*primary failure*'

            $script:cleanupCalled | Should -Be 1
        }

        It 'appends cleanup failure without erasing the primary failure' {
            {
                Invoke-ContabilidadeWithProbeCleanup `
                    -Operation { throw 'primary failure' } `
                    -Cleanup { throw 'cleanup failure' }
            } | Should -Throw '*STARTUP_OPERATION_FAILED*primary failure*STARTUP_CLEANUP_FAILED*cleanup failure*'
        }

        It 'fails when the operation succeeds but final cleanup fails' {
            {
                Invoke-ContabilidadeWithProbeCleanup `
                    -Operation { 'ok' } `
                    -Cleanup { throw 'cleanup failure' }
            } | Should -Throw '*cleanup failure*'
        }
    }
}
