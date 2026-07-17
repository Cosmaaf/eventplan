import ftplib
import os
import ssl

try:
    ftp = ftplib.FTP_TLS("m99337ml.beget.tech")
    ftp.login("m99337ml_12312", "0sdX1Xvgwz!u")
    ftp.prot_p()
    
    # Try to see if we are in public_html
    print("Files:", ftp.nlst())
    
    # Upload all files from dist
    dist_dir = "dist"
    
    def upload_dir(ftp, local_dir, remote_dir):
        try:
            ftp.mkd(remote_dir)
        except:
            pass
        ftp.cwd(remote_dir)
        for item in os.listdir(local_dir):
            local_path = os.path.join(local_dir, item)
            if os.path.isfile(local_path):
                print(f"Uploading {local_path}...")
                with open(local_path, "rb") as f:
                    ftp.storbinary(f"STOR {item}", f)
            elif os.path.isdir(local_path):
                upload_dir(ftp, local_path, item)
                ftp.cwd("..")

    # Assuming we need to upload to current directory or we need to find public_html
    files = ftp.nlst()
    if "public_html" in files:
        ftp.cwd("public_html")
        print("Moved to public_html")
    elif "m99337ml.beget.tech" in files:
        ftp.cwd("m99337ml.beget.tech/public_html")
        print("Moved to m99337ml.beget.tech/public_html")

    upload_dir(ftp, dist_dir, ".")
    print("Success")
    ftp.quit()
except Exception as e:
    print("Error:", e)
