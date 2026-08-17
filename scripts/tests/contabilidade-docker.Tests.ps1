$modulePath = Join-Path $PSScriptRoot '..\lib\contabilidade-docker.psm1'
Import-Module $modulePath -Force

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
