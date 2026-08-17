$modulePath = Join-Path $PSScriptRoot '..\lib\contabilidade-docker.psm1'
Import-Module $modulePath -Force

Describe 'PRIMA default Docker builder contract' {
    InModuleScope contabilidade-docker {
        BeforeEach {
            Mock Write-Host {}
            Mock Write-Warning {}
        }

        It 'selects and bootstraps the default Docker Desktop builder' {
            Mock Invoke-ContabilidadeDocker {
                [pscustomobject]@{
                    Success = $true
                    ExitCode = 0
                    Output = ''
                    StdOut = ''
                    StdErr = ''
                }
            }

            Use-ContabilidadeDefaultBuilder

            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1 -ParameterFilter {
                $Arguments[0] -eq 'buildx' -and
                $Arguments[1] -eq 'use' -and
                $Arguments[2] -eq 'default'
            }
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1 -ParameterFilter {
                $Arguments[0] -eq 'buildx' -and
                $Arguments[1] -eq 'inspect' -and
                $Arguments[2] -eq 'default' -and
                $Arguments -contains '--bootstrap'
            }
        }

        It 'removes only the legacy isolated builder when it exists' {
            Mock Invoke-ContabilidadeDocker {
                param($Arguments)
                if ($Arguments[0] -eq 'buildx' -and $Arguments[1] -eq 'ls') {
                    return [pscustomobject]@{
                        Success = $true
                        ExitCode = 0
                        Output = ''
                        StdOut = "default`ncontabilidade-runtime-builder`n"
                        StdErr = ''
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

            Remove-ContabilidadeLegacyIsolatedBuilder

            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1 -ParameterFilter {
                $Arguments[0] -eq 'buildx' -and
                $Arguments[1] -eq 'rm' -and
                $Arguments -contains '--force' -and
                $Arguments -contains 'contabilidade-runtime-builder'
            }
            Assert-MockCalled Invoke-ContabilidadeDocker -Times 0 -ParameterFilter {
                $Arguments[0] -eq 'system' -or $Arguments[0] -eq 'volume'
            }
        }

        It 'does not remove anything when the legacy builder is absent' {
            Mock Invoke-ContabilidadeDocker {
                [pscustomobject]@{
                    Success = $true
                    ExitCode = 0
                    Output = ''
                    StdOut = "default`n"
                    StdErr = ''
                }
            }

            Remove-ContabilidadeLegacyIsolatedBuilder

            Assert-MockCalled Invoke-ContabilidadeDocker -Times 0 -ParameterFilter {
                $Arguments[0] -eq 'buildx' -and $Arguments[1] -eq 'rm'
            }
        }
    }
}

Describe 'Docker build-network DNS classification' {
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
    }
}

Describe 'Assert-ContabilidadeDockerAvailable' {
    InModuleScope contabilidade-docker {
        BeforeEach {
            Mock Get-Command { 'docker.exe' }
            Mock Write-Host {}
        }

        It 'reports a stopped daemon before compose or buildx checks' {
            Mock Invoke-ContabilidadeDocker {
                [pscustomobject]@{
                    Success = $false
                    ExitCode = 125
                    Output = ''
                    StdOut = ''
                    StdErr = 'daemon unavailable'
                }
            }

            { Assert-ContabilidadeDockerAvailable } |
                Should -Throw '*daemon nao esta acessivel*'
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
                        Output = ''
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
