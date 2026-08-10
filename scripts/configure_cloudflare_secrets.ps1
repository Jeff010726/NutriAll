$ErrorActionPreference = "Stop"

try {
  $env:XDG_CONFIG_HOME = "C:\Projects\NutriAll\.wrangler-config"
  Set-Location "C:\Projects\NutriAll"

  Write-Host "NutriAll Cloudflare secret setup" -ForegroundColor Green
  Write-Host ""
  Write-Host "1/2 Enter the QQ SMTP authorization code (not the QQ login password)."
  & "C:\Program Files\nodejs\npx.cmd" wrangler secret put SMTP_PASSWORD
  if ($LASTEXITCODE -ne 0) { throw "SMTP_PASSWORD was not saved (exit code $LASTEXITCODE)" }

  Write-Host ""
  Write-Host "2/2 Enter a new strong password for the NutriAll admin dashboard."
  & "C:\Program Files\nodejs\npx.cmd" wrangler secret put ADMIN_PASSWORD
  if ($LASTEXITCODE -ne 0) { throw "ADMIN_PASSWORD was not saved (exit code $LASTEXITCODE)" }

  Write-Host ""
  Write-Host "Both secrets were saved to Cloudflare." -ForegroundColor Green
} catch {
  Write-Host ""
  Write-Host "Setup failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Press Enter to close this window."
Read-Host
