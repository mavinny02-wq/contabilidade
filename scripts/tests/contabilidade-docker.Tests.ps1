$modulePath = Join-Path $PSScriptRoot '..\lib\contabilidade-docker.psm1'
Import-Module $modulePath -Force

Describe 'Invoke-ContabilidadeDocker structured execution' {
    InModuleScope contabilidade-docker {
        BeforeEach {
            Mock Write-Host {}
            Mock Write-Warning {}
        }

        It 'returns a structured CLI-unavailable result when failure is allowed' {
            Mock Get-Command { $null }
            Mock Invoke-ContabilidadeNativeCommand { throw 'native command must not run' }

            $result = Invoke-ContabilidadeDocker -Arguments @('info') -AllowFailure -Quiet
            $result.Success | Should -BeFalse
            $result.ExitCode | Should -Be 127
            $result.StdErr | Should -Match 'Docker CLI unavailable'
            Assert-MockCalled Invoke-ContabilidadeNativeCommand -Times 0
        }

        It 'uses the resolved docker executable and returns native stderr without throwing' {
            Mock Get-Command {
                [pscustomobject]@{ Source = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'; Path = $null }
            }
            Mock Invoke-ContabilidadeNativeCommand {
                param($FilePath, $Arguments)
                $FilePath | Should -Match 'docker\.exe$'
                [pscustomobject]@{
                    Success = $false
                    ExitCode = 1
                    StdOut = ''
                    StdErr = 'No such container: probe'
                    Output = 'No such container: probe'
                }
            }

            $result = Invoke-ContabilidadeDocker -Arguments @('container', 'rm', '--force', 'probe') -AllowFailure -Quiet
            $result.Success | Should -BeFalse
            $result.ExitCode | Should -Be 1
            $result.StdErr | Should -Match 'No such container'
        }

        It 'throws a classified CLI error when failure is not allowed' {
            Mock Get-Command { $null }

            { Invoke-ContabilidadeDocker -Arguments @('info') -Quiet } |
                Should -Throw '*DOCKER_CLI_UNAVAILABLE*'
        }
    }
}

Describe 'PRIMA active Docker context contract' {
    InModuleScope contabilidade-docker {
        BeforeEach {
            Mock Write-Host {}
            Mock Write-Warning {}
        }

        It 'preserves desktop-linux and never switches Docker context or builder' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[0] -eq 'context' -and $Arguments[1] -eq 'show') {
                    return [pscustomobject]@{
                        Success = $true
                        ExitCode = 0
                        Output = "desktop-linux`n"
                        StdOut = "desktop-linux`n"
                        StdErr = ''
                    }
                }
                throw "Unexpected Docker call: $($Arguments -join ' ')"
            }

            Get-ContabilidadeActiveDockerContext | Should -Be 'desktop-linux'

            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1 -ParameterFilter {
                $Arguments[0] -eq 'context' -and $Arguments[1] -eq 'show'
            }
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 0 -ParameterFilter {
                ($Arguments[0] -eq 'context' -and $Arguments[1] -eq 'use') -or
                ($Arguments[0] -eq 'buildx' -and $Arguments[1] -eq 'use')
            }
        }

        It 'fails clearly when Docker cannot report the active context' {
            Mock Invoke-ContabilidadeDocker {
                [pscustomobject]@{
                    Success = $false
                    ExitCode = 1
                    Output = 'context unavailable'
                    StdOut = ''
                    StdErr = 'context unavailable'
                }
            }
            Mock Write-ContabilidadeNativeOutput {}

            { Get-ContabilidadeActiveDockerContext } |
                Should -Throw '*consultar o contexto Docker ativo*Exit code: 1*'
        }

        It 'fails clearly when Docker returns an empty context name' {
            Mock Invoke-ContabilidadeDocker {
                [pscustomobject]@{
                    Success = $true
                    ExitCode = 0
                    Output = ''
                    StdOut = "`r`n"
                    StdErr = ''
                }
            }

            { Get-ContabilidadeActiveDockerContext } |
                Should -Throw '*nao informou um contexto ativo*'
        }
    }
}

Describe 'Docker failure classification' {
    InModuleScope contabilidade-docker {
        It 'classifies the reported Docker Desktop resolver failure' {
            $content = 'dial tcp: lookup registry-1.docker.io on 192.168.65.7:53: no such host'

            Test-ContabilidadeDockerDnsFailure -Content $content | Should -BeTrue
            Get-ContabilidadeFailedRegistryHost -Content $content |
                Should -Be 'registry-1.docker.io'
        }

        It 'classifies Maven-style unknown-host failures used by PRIMA' {
            Test-ContabilidadeDockerDnsFailure -Content 'Unknown host repo.maven.apache.org' |
                Should -BeTrue
        }

        It 'does not treat registry authentication as DNS failure' {
            Test-ContabilidadeDockerDnsFailure -Content 'failed to authorize: 401 Unauthorized' |
                Should -BeFalse
        }

        It 'classifies a missing container without hiding other failures' {
            Test-ContabilidadeDockerContainerAbsent -Content 'Error response from daemon: No such container: probe' |
                Should -BeTrue
            Test-ContabilidadeDockerContainerAbsent -Content 'Error: No such object: probe' |
                Should -BeTrue
            Get-ContabilidadeDockerFailureCategory -Content 'Error response from daemon: No such container: probe' |
                Should -Be 'CONTAINER_ABSENT_EXPECTED'
            Get-ContabilidadeDockerFailureCategory -Content 'permission denied while removing probe' |
                Should -Be 'DOCKER_PERMISSION_OR_API_FAILURE'
        }

        It 'classifies a stopped Docker Desktop daemon' {
            Get-ContabilidadeDockerFailureCategory -Content 'error during connect: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.' |
                Should -Be 'DOCKER_DAEMON_UNAVAILABLE'
        }
    }
}

Describe 'Docker image verification' {
    InModuleScope contabilidade-docker {
        BeforeEach {
            Mock Get-Command { 'docker.exe' }
        }

        It 'returns IMAGE_AVAILABLE when image inspect succeeds' {
            Mock Invoke-ContabilidadeDocker {
                [pscustomobject]@{
                    Success = $true
                    ExitCode = 0
                    Output = '{}'
                    StdOut = '{}'
                    StdErr = ''
                }
            }

            $result = Test-ContabilidadeDockerImage -Image 'contabilidade-frontend:0.5.1'
            $result.Available | Should -BeTrue
            $result.Category | Should -Be 'IMAGE_AVAILABLE'
        }

        It 'returns IMAGE_MISSING for an absent image' {
            Mock Invoke-ContabilidadeDocker {
                [pscustomobject]@{
                    Success = $false
                    ExitCode = 1
                    Output = 'Error response from daemon: No such image: missing:test'
                    StdOut = ''
                    StdErr = 'Error response from daemon: No such image: missing:test'
                }
            }

            $result = Test-ContabilidadeDockerImage -Image 'missing:test'
            $result.Available | Should -BeFalse
            $result.Category | Should -Be 'IMAGE_MISSING'
        }

        It 'returns DOCKER_DAEMON_UNAVAILABLE when image inspect cannot reach Docker Desktop' {
            Mock Invoke-ContabilidadeDocker {
                [pscustomobject]@{
                    Success = $false
                    ExitCode = 125
                    Output = 'Cannot connect to the Docker daemon'
                    StdOut = ''
                    StdErr = 'Cannot connect to the Docker daemon'
                }
            }

            $result = Test-ContabilidadeDockerImage -Image 'any:test'
            $result.Available | Should -BeFalse
            $result.Category | Should -Be 'DOCKER_DAEMON_UNAVAILABLE'
        }

        It 'returns DOCKER_CLI_UNAVAILABLE before invoking Docker' {
            Mock Get-Command { $null }
            Mock Invoke-ContabilidadeDocker { throw 'Docker must not be invoked' }

            $result = Test-ContabilidadeDockerImage -Image 'any:test'
            $result.Available | Should -BeFalse
            $result.Category | Should -Be 'DOCKER_CLI_UNAVAILABLE'
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 0
        }
    }
}

Describe 'Runtime image content verification' {
    InModuleScope contabilidade-docker {
        BeforeEach {
            Mock Get-Command { 'docker.exe' }
        }

        It 'returns RUNTIME_IMAGE_VERIFIED after inspect and content probe succeed' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[0] -eq 'image' -and $Arguments[1] -eq 'inspect') {
                    return [pscustomobject]@{
                        Success = $true
                        ExitCode = 0
                        Output = '{}'
                        StdOut = '{}'
                        StdErr = ''
                    }
                }
                if ($Arguments[0] -eq 'run') {
                    return [pscustomobject]@{
                        Success = $true
                        ExitCode = 0
                        Output = ''
                        StdOut = ''
                        StdErr = ''
                    }
                }
                throw "Unexpected Docker call: $($Arguments -join ' ')"
            }

            $result = Test-ContabilidadeRuntimeImage `
                -Image 'contabilidade-backend:0.5.1' `
                -DisplayName 'backend' `
                -ValidationCommand 'test -f /app/app.jar'

            $result.Verified | Should -BeTrue
            $result.Category | Should -Be 'RUNTIME_IMAGE_VERIFIED'
        }

        It 'does not run a content probe when the image is absent' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[0] -eq 'image' -and $Arguments[1] -eq 'inspect') {
                    return [pscustomobject]@{
                        Success = $false
                        ExitCode = 1
                        Output = 'No such image: missing:test'
                        StdOut = ''
                        StdErr = 'No such image: missing:test'
                    }
                }
                throw 'Content probe must not run for a missing image.'
            }

            $result = Test-ContabilidadeRuntimeImage `
                -Image 'missing:test' `
                -DisplayName 'missing' `
                -ValidationCommand 'true'

            $result.Verified | Should -BeFalse
            $result.Category | Should -Be 'IMAGE_MISSING'
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 0 -ParameterFilter {
                $Arguments[0] -eq 'run'
            }
        }

        It 'keeps a real container validation failure red' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[0] -eq 'image' -and $Arguments[1] -eq 'inspect') {
                    return [pscustomobject]@{
                        Success = $true
                        ExitCode = 0
                        Output = '{}'
                        StdOut = '{}'
                        StdErr = ''
                    }
                }
                if ($Arguments[0] -eq 'run') {
                    return [pscustomobject]@{
                        Success = $false
                        ExitCode = 42
                        Output = 'validation command failed'
                        StdOut = ''
                        StdErr = 'validation command failed'
                    }
                }
                throw "Unexpected Docker call: $($Arguments -join ' ')"
            }

            $result = Test-ContabilidadeRuntimeImage `
                -Image 'contabilidade-frontend:0.5.1' `
                -DisplayName 'frontend' `
                -ValidationCommand 'test -f /missing'

            $result.Verified | Should -BeFalse
            $result.Category | Should -Be 'DOCKER_PERMISSION_OR_API_FAILURE'
            $result.ExitCode | Should -Be 42
        }
    }
}

Describe 'Assert-ContabilidadeDockerAvailable' {
    InModuleScope contabilidade-docker {
        BeforeEach {
            Mock Get-Command { 'docker.exe' }
            Mock Write-Host {}
        }

        It 'reports a missing CLI before daemon checks' {
            Mock Get-Command { $null }
            Mock Invoke-ContabilidadeDocker { throw 'Docker must not be invoked' }

            { Assert-ContabilidadeDockerAvailable } |
                Should -Throw '*DOCKER_CLI_UNAVAILABLE*'
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 0
        }

        It 'reports a stopped daemon before compose or buildx checks' {
            Mock Invoke-ContabilidadeDocker {
                [pscustomobject]@{
                    Success = $false
                    ExitCode = 125
                    Output = 'Cannot connect to the Docker daemon'
                    StdOut = ''
                    StdErr = 'Cannot connect to the Docker daemon'
                }
            }

            { Assert-ContabilidadeDockerAvailable } |
                Should -Throw '*DOCKER_DAEMON_UNAVAILABLE*'
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1
        }

        It 'requires Docker Compose and Buildx supplied by Docker Desktop' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[0] -eq 'info') {
                    return [pscustomobject]@{
                        Success = $true
                        ExitCode = 0
                        Output = ''
                        StdOut = ''
                        StdErr = ''
                    }
                }
                if ($Arguments[0] -eq 'compose') {
                    return [pscustomobject]@{
                        Success = $false
                        ExitCode = 1
                        Output = 'missing'
                        StdOut = ''
                        StdErr = 'missing'
                    }
                }
                return [pscustomobject]@{
                    Success = $true
                    ExitCode = 0
                    Output = ''
                    StdOut = ''
                    StdErr = ''
                }
            }

            { Assert-ContabilidadeDockerAvailable } |
                Should -Throw '*Compose v2 indisponivel*'
        }
    }
}
