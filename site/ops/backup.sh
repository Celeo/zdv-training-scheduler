#!/bin/bash -e

if [ -z "$1" ]
then
  echo "Missing target file argument"
  exit 1
fi

if [ -z "$B2_KEY_ID" ]
then
  echo "Missing B2_KEY_ID env var"
  exit 1
fi

if [ -z "$B2_AUTH_KEY" ]
then
  echo "Missing B2_AUTH_KEY env var"
  exit 1
fi

if [ ! -e $1 ]
then
  echo 'File does not exist'
  exit 1
fi

echo "$(date) -- Starting file backup of: $1"
auth_resp=$(xh -p b https://api.backblazeb2.com/b2api/v3/b2_authorize_account -A basic -a $B2_KEY_ID:$B2_AUTH_KEY)
bucket_id=$(echo $auth_resp | jq -r .apiInfo.storageApi.bucketId)
auth_token=$(echo $auth_resp | jq -r .authorizationToken)

upload_loc_resp=$(xh https://api005.backblazeb2.com/b2api/v2/b2_get_upload_url bucketId==$bucket_id "Authorization:$auth_token")
upload_url=$(echo $upload_loc_resp | jq -r .uploadUrl)
upload_auth_token=$(echo $upload_loc_resp | jq -r .authorizationToken)

checksum=$(sha1sum $1 | awk '{print $1}')
upload_resp=$(xh post $upload_url @$1 "Authorization:$upload_auth_token" "Content-Type:binary/octet-stream" "X-Bz-File-Name:$1_$(date +%s)" "X-Bz-Content-Sha1:$checksum")
echo "File uploaded ... $(echo $upload_resp | jq -r .fileId)"
