# Installs only the owner-requested local README workflow; no service, account or startup registration.
param([Parameter(Mandatory=$true)][string]$PetOs)
$ErrorActionPreference='Stop'
$auditorRoot=Split-Path $PSScriptRoot -Parent
$auditorPetOs=(Resolve-Path -LiteralPath $PetOs).Path
$auditorNode=(Get-Command node -ErrorAction Stop).Source
$auditorCodex=(Get-Command codex -ErrorAction Stop).Source
$auditorProtocol='HKCU:\Software\Classes\astras-goldfish'
$auditorShell=Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$auditorLauncher=Join-Path $PSScriptRoot 'start-readme-auditor-20261015.ps1'
$auditorCommand='"'+$auditorShell+'" -NoProfile -WindowStyle Hidden -File "'+$auditorLauncher+'"'
if(Test-Path -LiteralPath $auditorProtocol){
  $registered=(Get-Item -LiteralPath ($auditorProtocol+'\shell\open\command')).GetValue('')
  if($registered -ne $auditorCommand){throw 'The astras-goldfish protocol belongs to another command; inspect it before replacing it.'}
}
& $auditorNode --input-type=module -e 'import {readFileSync} from "node:fs";import {pathToFileURL} from "node:url";import {join} from "node:path";const r=process.argv[1];const {assertAnimal}=await import(pathToFileURL(join(r,"scripts/animal-guard-20261013.mjs")));assertAnimal(JSON.parse(readFileSync(join(r,"pets.json"))),"github-goldfish","install the requested local README auditor");' $auditorPetOs
if($LASTEXITCODE -ne 0){throw 'Goldfish is not registered in this farm.'}
$auditorData=Join-Path $env:LOCALAPPDATA 'astras-pet-os\github-aquarium\readme-auditor'
New-Item -ItemType Directory -Path $auditorData -Force | Out-Null
$auditorConfig=Join-Path $auditorData 'configuration-20261015.json'
if(Test-Path -LiteralPath $auditorConfig){Copy-Item -LiteralPath $auditorConfig -Destination (Join-Path $auditorData ('configuration-before-install-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.json'))}
$auditorJson=@{schema=1;node=$auditorNode;codex=$auditorCodex;petOs=$auditorPetOs;data=$auditorData;port=8769;profileRepository='findastra/findastra'} | ConvertTo-Json
[IO.File]::WriteAllText($auditorConfig,$auditorJson,(New-Object Text.UTF8Encoding $false))
New-Item -Path ($auditorProtocol+'\shell\open\command') -Force | Out-Null
Set-Item -LiteralPath $auditorProtocol -Value 'URL:GitHub Goldfish README auditor'
New-ItemProperty -LiteralPath $auditorProtocol -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
# No untrusted URI interpolation: this scheme has exactly one fixed action.
Set-Item -LiteralPath ($auditorProtocol+'\shell\open\command') -Value $auditorCommand
Write-Output 'Local Goldfish README auditor configured. Desktop triple-click and the Aquarium launcher use this same tool.'
