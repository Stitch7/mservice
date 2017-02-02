#!/usr/bin/env bash
## M!Service Backup

# Setup
BACKUP_DIR="/Backup"
SYNC_DIR="/OneDrive"
SECRET="/root/.backupsecret"
CONTAINER_NAME="mservicedb"

# Enter Backup directory
cd $BACKUP_DIR
# Create dump
docker exec -it $CONTAINER_NAME mongodump --db mservice -o /data/backup
# Create tarball
tar -cvzf $(CONTAINER_NAME).tar.gz mservice/
# Encrypt tarball
cat $SECRET | gpg -c --passphrase-fd 0 $(CONTAINER_NAME).tar.gz
# Move to OneDrive
mv $(CONTAINER_NAME).tar.gz.gpg $(SYNC_DIR)/mservice/$(CONTAINER_NAME)_-_$(date +%Y-%m-%d_%H-%M-%S).tar.gz.gpg

## TODO: Remove old files
# https://stackoverflow.com/questions/25785/delete-all-but-the-most-recent-x-files-in-bash