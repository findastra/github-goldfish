param([switch]$AutoRun, [string]$Uri)
$ErrorActionPreference='Stop'
trap {
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show(('The README auditor could not open. '+$_.Exception.Message),'GitHub Goldfish') | Out-Null
  exit 1
}
$auditorData=Join-Path $env:LOCALAPPDATA 'astras-pet-os\github-aquarium\readme-auditor'
$auditorConfig=Join-Path $auditorData 'configuration-20261015.json'
if (!(Test-Path -LiteralPath $auditorConfig)) { throw 'The README auditor is not configured on this PC.' }
$auditorSettings=Get-Content -LiteralPath $auditorConfig -Raw | ConvertFrom-Json
$auditorConnection=Join-Path $auditorData 'connection-20261015.json'
function Get-AuditorConnection {
  if (!(Test-Path -LiteralPath $auditorConnection)) { return $null }
  try {
    $current=Get-Content -LiteralPath $auditorConnection -Raw | ConvertFrom-Json
    if ($current.port -ne $auditorSettings.port) { return $null }
    $null=Invoke-RestMethod -Uri ('http://127.0.0.1:'+$current.port+'/api/status') -Headers @{ Authorization=('Bearer '+$current.token) } -TimeoutSec 2
    return $current
  } catch { return $null }
}
$auditorLink=Get-AuditorConnection
if (!$auditorLink) {
  $auditorServer=Join-Path $PSScriptRoot 'readme-auditor-server-20261015.mjs'
  Start-Process -FilePath $auditorSettings.node -ArgumentList @(('"'+$auditorServer+'"'),'--config',('"'+$auditorConfig+'"')) -WindowStyle Hidden -RedirectStandardOutput (Join-Path $auditorData 'server-output-20261015.log') -RedirectStandardError (Join-Path $auditorData 'server-error-20261015.log') | Out-Null
  for($attempt=0;$attempt -lt 30 -and !$auditorLink;$attempt++){Start-Sleep -Milliseconds 200;$auditorLink=Get-AuditorConnection}
}
if (!$auditorLink) { throw 'The local README auditor did not start. Check its server error log.' }
if ($Uri -and $Uri -notin @('astras-goldfish:readme-auditor','astras-goldfish:readme-auditor/')) { throw 'Unknown Goldfish action.' }
$auditorUrl='http://127.0.0.1:'+$auditorLink.port+'/#token='+$auditorLink.token
if($AutoRun){$auditorUrl+='&start=1'}
Start-Process -FilePath $auditorUrl
