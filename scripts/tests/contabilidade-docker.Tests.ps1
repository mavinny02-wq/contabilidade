$modulePath = Join-Path $PSScriptRoot '..\lib\contabilidade-docker.psm1'
Import-Module $modulePath -Force

Describe 'Initialize-ContabilidadeBuilder' {
    InModuleScope contabilidade-docker {
        BeforeEach {
            Mock Write-Host {}
            Mock Write-Warning {}
        }

        It 'reuses and bootstraps an existing builder without creating another' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments -contains '--bootstrap') {
                    return [pscustomobject]@{ Success = $true; ExitCode = 0; Output = "Driver: docker-container`n"; StdOut = ''; StdErr = '' }
                }
                if ($Arguments[1] -eq 'inspect') {
                    return [pscustomobject]@{ Success = $true; ExitCode = 0; Output = "Driver: docker-container`n"; StdOut = ''; StdErr = '' }
                }
                return [pscustomobject]@{ Success = $true; ExitCode = 0; Output = ''; StdOut = ''; StdErr = '' }
            }

            Initialize-ContabilidadeBuilder -BuilderName 'contabilidade-runtime-builder'

            Assert-MockCalled Invoke-ContabilidadeDocker -Times 0 -ParameterFilter { $Arguments[1] -eq 'create' }
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1 -ParameterFilter { $Arguments[1] -eq 'use' }
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1 -ParameterFilter { $Arguments -contains '--bootstrap' }
        }

        It 'creates, selects and bootstraps a missing builder' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[1] -eq 'inspect' -and -not ($Arguments -contains '--bootstrap')) {
                    return [pscustomobject]@{ Success = $false; ExitCode = 1; Output = ''; StdOut = ''; StdErr = 'not found' }
                }
                if ($Arguments[1] -eq 'ls') {
                    return [pscustomobject]@{ Success = $true; ExitCode = 0; Output = ''; StdOut = "default`n"; StdErr = '' }
                }
                if ($Arguments -contains '--bootstrap') {
                    return [pscustomobject]@{ Success = $true; ExitCode = 0; Output = "Driver: docker-container`n"; StdOut = ''; StdErr = '' }
                }
                return [pscustomobject]@{ Success = $true; ExitCode = 0; Output = ''; StdOut = ''; StdErr = '' }
            }

            Initialize-ContabilidadeBuilder -BuilderName 'contabilidade-runtime-builder'

            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1 -ParameterFilter {
                $Arguments[1] -eq 'create' -and $Arguments -contains 'default-load=true,restart-policy=unless-stopped'
            }
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1 -ParameterFilter { $Arguments[1] -eq 'use' }
        }

        It 'does not recreate an existing builder whose inspect fails' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[1] -eq 'ls') {
                    return [pscustomobject]@{ Success = $true; ExitCode = 0; Output = ''; StdOut = "contabilidade-runtime-builder`n"; StdErr = '' }
                }
                return [pscustomobject]@{ Success = $false; ExitCode = 1; Output = ''; StdOut = ''; StdErr = 'unreachable' }
            }

            { Initialize-ContabilidadeBuilder -BuilderName 'contabilidade-runtime-builder' } |
                Should -Throw '*quebrado ou inacessivel*'
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 0 -ParameterFilter { $Arguments[1] -eq 'create' }
        }

        It 'propagates a builder creation failure' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[1] -eq 'inspect') {
                    return [pscustomobject]@{ Success = $false; ExitCode = 1; Output = ''; StdOut = ''; StdErr = 'not found' }
                }
                if ($Arguments[1] -eq 'ls') {
                    return [pscustomobject]@{ Success = $true; ExitCode = 0; Output = ''; StdOut = ''; StdErr = '' }
                }
                return [pscustomobject]@{ Success = $false; ExitCode = 23; Output = ''; StdOut = ''; StdErr = 'create failed' }
            }

            { Initialize-ContabilidadeBuilder -BuilderName 'contabilidade-runtime-builder' } |
                Should -Throw '*Falha ao criar*Exit code: 23*'
        }

        It 'propagates a bootstrap failure' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments -contains '--bootstrap') {
                    return [pscustomobject]@{ Success = $false; ExitCode = 42; Output = ''; StdOut = ''; StdErr = 'bootstrap failed' }
                }
                if ($Arguments[1] -eq 'inspect') {
                    return [pscustomobject]@{ Success = $true; ExitCode = 0; Output = "Driver: docker-container`n"; StdOut = ''; StdErr = '' }
                }
                return [pscustomobject]@{ Success = $true; ExitCode = 0; Output = ''; StdOut = ''; StdErr = '' }
            }

            { Initialize-ContabilidadeBuilder -BuilderName 'contabilidade-runtime-builder' } |
                Should -Throw '*Falha no bootstrap*Exit code: 42*'
        }
    }
}

Describe 'Assert-ContabilidadeDockerAvailable' {
    InModuleScope contabilidade-docker {
        It 'reports a stopped daemon before checking Buildx' {
            Mock Get-Command { 'docker.exe' }
            Mock Write-Host {}
            Mock Invoke-ContabilidadeDocker {
                [pscustomobject]@{ Success = $false; ExitCode = 125; Output = ''; StdOut = ''; StdErr = 'daemon unavailable' }
            }

            { Assert-ContabilidadeDockerAvailable } | Should -Throw '*daemon nao esta acessivel*'
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1
        }

        It 'reports an unavailable Buildx plugin' {
            Mock Get-Command { 'docker.exe' }
            Mock Write-Host {}
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[0] -eq 'info') {
                    return [pscustomobject]@{ Success = $true; ExitCode = 0; Output = ''; StdOut = ''; StdErr = '' }
                }
                return [pscustomobject]@{ Success = $false; ExitCode = 1; Output = ''; StdOut = ''; StdErr = 'unknown command' }
            }

            { Assert-ContabilidadeDockerAvailable } | Should -Throw '*Buildx indisponivel*'
        }
    }
}
