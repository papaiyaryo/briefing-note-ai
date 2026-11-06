$ErrorActionPreference = 'Stop'
$record = 'aidlc/spaces/default/intents/261011-company-data-management'
$out = "$record/construction/build-and-test"
$nodeDir = (Resolve-Path '.npm/u1-cache/_npx/52027bd8fc0022aa/node_modules/node/bin').Path
$env:PATH = "$nodeDir;$env:PATH"
$env:U1_TEST_DATABASE_URL = 'postgresql://workspace_test_admin:local-test-only@127.0.0.1:55432/workspace_test'
$env:OCR_PROVIDER = 'dummy'
$env:STRUCTURE_PROVIDER = 'dummy'
$env:WEB_SUPPLEMENT_PROVIDER = 'dummy'
$env:INTERVIEW_REVIEW_PROVIDER = 'dummy'
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:npm_config_cache = Join-Path $env:TEMP 'briefing-bolt2-verification-npm'
$npmCli = 'C:/Users/ryoka/AppData/Local/Volta/tools/image/node/24.11.0/node_modules/npm/bin/npm-cli.js'
if (-not (Test-Path $npmCli)) { $npmCli = 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js' }
if (-not (Test-Path $npmCli)) { throw 'Existing npm-cli.js location must be resolved before executing checks.' }
$commands = [Collections.Generic.List[string]]::new()
foreach($c in @('npm run lint','npm run typecheck','npm test','npm test -- --passWithNoTests=false --coverage','npm run build')) {$commands.Add($c)}
foreach($f in Get-ChildItem "$record/construction/*/code-generation/unit-test-instructions.md") {
  foreach($m in [regex]::Matches((Get-Content $f.FullName -Raw),'(?m)^npm test[^\r\n]*')) {
    if(-not $commands.Contains($m.Value)) {$commands.Add($m.Value)}
  }
}
$results = @()
for($i=0; $i -lt $commands.Count; $i++) {
  $c=$commands[$i]
  $log=Join-Path $out ('check-{0:d2}.log' -f ($i+1))
  $started=[DateTimeOffset]::UtcNow
  $argv=$c.Substring(4).Split(' ',[StringSplitOptions]::RemoveEmptyEntries)
  & "$nodeDir/node.exe" $npmCli @argv *> $log
  $code=$LASTEXITCODE
  $results += [pscustomobject]@{command=$c;exit=$code;started=$started.ToString('o');seconds=([DateTimeOffset]::UtcNow-$started).TotalSeconds;log=$log}
  $results | ConvertTo-Json -Depth 4 | Set-Content "$out/command-results.json" -Encoding utf8
  Write-Output "$($i+1)/$($commands.Count) exit=$code $c"
  if($code -ne 0) {Get-Content $log -Tail 50; exit $code}
}
