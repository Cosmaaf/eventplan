import * as ftp from "basic-ftp"

async function upload() {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "m99337ml.beget.tech",
            user: "m99337ml_12312",
            password: "0sdX1Xvgwz!u",
            secure: true,
            secureOptions: { rejectUnauthorized: false }
        })
        console.log("Connected successfully!");
        
        const list = await client.list()
        console.log("Root directory contents:");
        console.log(list.map(f => f.name));

        // Let's determine where to upload
        // In Beget, the root might have 'public_html' or we are already inside it.
        // Or we might need to go to 'm99337ml.beget.tech/public_html'.
        
        let targetDir = "/";
        if (list.find(f => f.name === "m99337ml.beget.tech")) {
            targetDir = "/m99337ml.beget.tech/public_html";
        } else if (list.find(f => f.name === "public_html")) {
            targetDir = "/public_html";
        }

        console.log(`Uploading to ${targetDir}...`);
        await client.cd(targetDir);
        await client.clearWorkingDir();
        await client.uploadFromDir("dist");
        
        console.log("Upload completed!");
    }
    catch(err) {
        console.log(err)
    }
    client.close()
}

upload()
