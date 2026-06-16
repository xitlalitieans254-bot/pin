import paramiko
import os
import zipfile
import subprocess
import sys
import config

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# --- 本地与远程路径配置 ---
LOCAL_PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../tt-zhipin-admin-ui"))
LOCAL_DIST_DIR = os.path.join(LOCAL_PROJECT_DIR, "dist")
ZIP_FILENAME = "admin_dist.zip"

REMOTE_HOME = f"/home/{config.FRONTEND_USERNAME}"
REMOTE_ZIP = f"{REMOTE_HOME}/{ZIP_FILENAME}"

def build_frontend():
    print("🔨 [1/4] 正在本地执行构建 (npm run build)...")
    if not os.path.exists(LOCAL_PROJECT_DIR):
        print(f"❌ 错误: 找不到本地项目目录 {LOCAL_PROJECT_DIR}")
        sys.exit(1)
        
    try:
        # 在项目目录下运行打包命令，自动尝试 pnpm, yarn 或 npm
        build_cmd = "pnpm build"
        if os.path.exists(os.path.join(LOCAL_PROJECT_DIR, "pnpm-lock.yaml")):
            build_cmd = "pnpm build"
        elif os.path.exists(os.path.join(LOCAL_PROJECT_DIR, "yarn.lock")):
            build_cmd = "yarn build"
        else:
            build_cmd = "npm run build"
            
        print(f"执行命令: {build_cmd} 于 {LOCAL_PROJECT_DIR}")
        subprocess.run(build_cmd, shell=True, check=True, cwd=LOCAL_PROJECT_DIR)
        print("✅ 本地构建成功！")
    except subprocess.CalledProcessError:
        print("❌ 构建失败，请检查编译错误。")
        sys.exit(1)

def create_zip():
    print(f"📦 [2/4] 正在打包 {LOCAL_DIST_DIR} 到 {ZIP_FILENAME}...")
    if not os.path.exists(LOCAL_DIST_DIR):
        print(f"❌ 错误: 找不到构建输出目录 {LOCAL_DIST_DIR}，请确保本地打包成功。")
        sys.exit(1)
        
    with zipfile.ZipFile(ZIP_FILENAME, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(LOCAL_DIST_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                # 计算相对路径，解包后直接平铺在目标目录下
                arcname = os.path.relpath(file_path, LOCAL_DIST_DIR)
                zipf.write(file_path, arcname)
    print("✅ 压缩打包完成。")

def deploy():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"🔌 [3/4] 正在连接到前端服务器 {config.FRONTEND_HOST}...")
        ssh.connect(
            config.FRONTEND_HOST,
            port=config.FRONTEND_PORT,
            username=config.FRONTEND_USERNAME,
            password=config.FRONTEND_PASSWORD
        )
        
        # 上传压缩包
        sftp = ssh.open_sftp()
        print(f"📤 正在上传部署包 {ZIP_FILENAME} -> {REMOTE_ZIP}...")
        sftp.put(ZIP_FILENAME, REMOTE_ZIP)
        sftp.close()
        print("✅ 上传成功。")
        
        # 远程执行部署命令
        print("🚀 [4/4] 正在服务器上执行部署解压命令...")
        
        # 因为 /var/www/tt-zhipin/admin 的所有权是 ubuntu，所以不需要 sudo 进行文件操作
        commands = [
            # 1. 清空远端 Nginx 静态目录旧文件
            f"rm -rf {config.FRONTEND_ADMIN_DIR}/*",
            # 2. 确保目录存在
            f"mkdir -p {config.FRONTEND_ADMIN_DIR}",
            # 3. 解压压缩包到静态目录
            f"unzip -o {REMOTE_ZIP} -d {config.FRONTEND_ADMIN_DIR}",
            # 4. 删除临时压缩包
            f"rm -f {REMOTE_ZIP}"
        ]
        
        full_command = " && ".join(commands)
        stdin, stdout, stderr = ssh.exec_command(full_command)
        
        # 获取输出日志
        exit_status = stdout.channel.recv_exit_status()
        if exit_status == 0:
            print("\n✨ tt-zhipin 管理后台部署全部完成！")
            print(f"🔗 访问地址: https://{config.FRONTEND_HOST}/admin/ (或已配置域名)")
        else:
            print(f"\n❌ 部署命令执行失败 (Exit Code: {exit_status})")
            print("错误日志:\n", stderr.read().decode())

    except Exception as e:
        print(f"\n❌ 连接或部署出错: {str(e)}")
    finally:
        ssh.close()
        # 清除本地临时压缩包
        if os.path.exists(ZIP_FILENAME):
            os.remove(ZIP_FILENAME)

if __name__ == "__main__":
    build_frontend()
    create_zip()
    deploy()
