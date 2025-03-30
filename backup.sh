#!/bin/bash
cd 'C:\xampp\mysql\bin'
backup_dir='C:\backup'
timestamp=$(date +"%Y%m%d%H%M%S")
backup_file="$backup_dir/limsdb_$timestamp.sql"
./mysqldump -u root limsdb > $backup_file
if [ $? -eq 0 ]; then
    echo "Database backup completed successfully. Backup saved to: $backup_file"
else
    echo "Error: Database backup failed."
fi
