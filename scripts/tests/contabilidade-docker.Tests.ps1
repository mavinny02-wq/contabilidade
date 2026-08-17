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

        It 'passes a project-scoped BuildKit config when creating the builder' {
            $configPath = Join-Path $TestDrive 'buildkitd.toml'
            Set-Content -LiteralPath $configPath -Value "[dns]`nnameservers=[`"1.1.1.1`"]" -Encoding UTF8

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

            $resolvedConfigPath = (Resolve-Path -LiteralPath $configPath).Path
            Initialize-ContabilidadeBuilder -BuilderName 'contabilidade-runtime-builder' -BuildKitConfigPath $configPath

            Assert-MockCalled Invoke-ContabilidadeDocker -Times 1 -ParameterFilter {
                $Arguments[1] -eq 'create' `
                    -and $Arguments -contains '--buildkitd-config' `
                    -and $Arguments -contains $resolvedConfigPath
            }
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

Describe 'BuildKit DNS recovery helpers' {
    InModuleScope contabilidade-docker {
        It 'classifies the Docker Desktop DNS failure shown by BuildKit' {
            $content = 'dial tcp: lookup registry-1.docker.io on 192.168.65.7:53: no such host'

            Test-ContabilidadeBuildKitDnsFailure -Content $content | Should -BeTrue
            @(Get-ContabilidadeFailedDnsServers -Content $content) -join ',' | Should -Be '192.168.65.7'
            Get-ContabilidadeFailedRegistryHost -Content $content | Should -Be 'registry-1.docker.io'
        }

        It 'does not classify an unrelated registry authentication failure as DNS' {
            Test-ContabilidadeBuildKitDnsFailure -Content 'failed to authorize: 401 Unauthorized' |
                Should -BeFalse
        }

        It 'uses explicit DNS, removes duplicates and rejects the failed embedded resolver' {
            $previous = $env:CONTABILIDADE_BUILDKIT_DNS
            try {
                $env:CONTABILIDADE_BUILDKIT_DNS = '192.168.65.7; 10.0.0.2,10.0.0.2 8.8.8.8'
                $servers = @(Get-ContabilidadeBuildKitDnsServers -RejectedServers @('192.168.65.7'))

                $servers -join ',' | Should -Be '10.0.0.2,8.8.8.8'
            }
            finally {
                $env:CONTABILIDADE_BUILDKIT_DNS = $previous
            }
        }

        It 'rejects an explicit configuration without a usable IPv4 server' {
            $previous = $env:CONTABILIDADE_BUILDKIT_DNS
            try {
                $env:CONTABILIDADE_BUILDKIT_DNS = '127.0.0.1;invalid'
                { Get-ContabilidadeBuildKitDnsServers } |
                    Should -Throw '*nenhum IPv4 valido*'
            }
            finally {
                $env:CONTABILIDADE_BUILDKIT_DNS = $previous
            }
        }

        It 'writes a deterministic project-scoped BuildKit DNS configuration' {
            $path = Join-Path $TestDrive 'buildkitd.contabilidade.toml'

            New-ContabilidadeBuildKitConfig -Path $path -DnsServers @('10.0.0.2', '8.8.8.8') | Out-Null
            $first = Get-Content -LiteralPath $path -Raw
            New-ContabilidadeBuildKitConfig -Path $path -DnsServers @('10.0.0.2', '8.8.8.8') | Out-Null
            $second = Get-Content -LiteralPath $path -Raw

            $first | Should -Be $second
            $first | Should -Match '\[dns\]'
            $first | Should -Match 'nameservers = \["10\.0\.0\.2", "8\.8\.8\.8"\]'
            $first | Should -Match 'Docker Desktop global nao e alterado'
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
