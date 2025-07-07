[0;1;32m●[0m mongod.service - MongoDB Database Server
     Loaded: loaded (]8;;file://speclode-api-prod/usr/lib/systemd/system/mongod.service/usr/lib/systemd/system/mongod.service]8;;; [0;1;32menabled[0m; preset: [0;1;32menabled[0m)
     Active: [0;1;32mactive (running)[0m since Thu 2025-06-26 02:37:29 UTC; 7s ago
 Invocation: c9fd52419a6049b69a843da3d56769df
       Docs: ]8;;https://docs.mongodb.org/manualhttps://docs.mongodb.org/manual]8;;
   Main PID: 124931 (mongod)
     Memory: 170.3M (peak: 170.6M)
        CPU: 1.310s
     CGroup: /system.slice/mongod.service
             └─[0;38;5;245m124931 /usr/bin/mongod --config /etc/mongod.conf[0m

Jun 26 02:37:29 speclode-api-prod systemd[1]: Started mongod.service - MongoDB Database Server.
Jun 26 02:37:29 speclode-api-prod mongod[124931]: {"t":{"$date":"2025-06-26T02:37:29.420Z"},"s":"I",  "c":"CONTROL",  "id":7484500, "ctx":"-","msg":"Environment variable MONGODB_CONFIG_OVERRIDE_NOFORK == 1, overriding \"processManagement.fork\" to false"}
