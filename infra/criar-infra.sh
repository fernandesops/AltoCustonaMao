#!/usr/bin/env bash
# Cria a infraestrutura do AutoCusto no Azure com Azure CLI (Cloud Shell já tem o `az`).
# Edite as variáveis e rode linha a linha na primeira vez.
set -euo pipefail

RG=rg-autocusto
LOCAL=brazilsouth
VM=vm-autocusto
DNS=autocusto-api-SEUNOME          # precisa ser único na região
MEU_IP=$(curl -s https://api.ipify.org)   # seu IP público, para liberar o RDP só para você
SENHA='TroqueEstaSenha#2026'       # mínimo 12 caracteres; não versione este arquivo com a senha real

az group create -n $RG -l $LOCAL

# IP público estático com nome DNS gratuito: <DNS>.brazilsouth.cloudapp.azure.com
az network public-ip create -g $RG -n ip-autocusto --sku Standard \
  --allocation-method Static --dns-name $DNS

# VM Windows (se o tamanho não existir na região, liste com: az vm list-sizes -l brazilsouth -o table)
az vm create -g $RG -n $VM \
  --image MicrosoftWindowsServer:WindowsServer:2022-datacenter-azure-edition:latest \
  --size Standard_B2s \
  --admin-username azureuser --admin-password "$SENHA" \
  --public-ip-address ip-autocusto --nsg-rule NONE

# Firewall (NSG): HTTP/HTTPS para todos, RDP só do seu IP. A porta 9000 NÃO é aberta.
az vm open-port -g $RG -n $VM --port 80,443 --priority 900
az network nsg rule create -g $RG --nsg-name ${VM}NSG -n rdp-meu-ip --priority 1000 \
  --protocol Tcp --access Allow --destination-port-ranges 3389 --source-address-prefixes "$MEU_IP/32"

# Desliga a VM sozinha todo dia às 23:00 (UTC) para economizar créditos
az vm auto-shutdown -g $RG -n $VM --time 2300

# Front-end: Azure Static Web Apps (plano Free)
az staticwebapp create -n autocusto-web -g $RG -l eastus2 --sku Free
echo "Token de deploy (vai para o secret AZURE_STATIC_WEB_APPS_API_TOKEN no GitHub):"
az staticwebapp secrets list -n autocusto-web --query "properties.apiKey" -o tsv
az staticwebapp show -n autocusto-web --query defaultHostname -o tsv
