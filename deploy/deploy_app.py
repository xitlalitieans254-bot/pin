import paramiko
import os
import sys
import config

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# --- 路径配置 ---
LOCAL_APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../ttZhipinApp"))
# React Native 安卓打包默认输出路径
LOCAL_APK_PATH = os.path.join(LOCAL_APP_DIR, "android/app/build/outputs/apk/release/app-release.apk")
# 远端最终文件名
REMOTE_APK_NAME = "tt-zhipin-latest.apk"
REMOTE_APK_PATH = f"{config.FRONTEND_DOWNLOAD_DIR}/{REMOTE_APK_NAME}"

def deploy_apk():
    print("🚀 正在准备发布 Android App 安装包...")
    
    # 1. 检查本地 APK 是否存在
    if not os.path.exists(LOCAL_APK_PATH):
        print("❌ 错误: 未能在本地找到打包好的 Release APK!")
        print(f"找寻路径: {LOCAL_APK_PATH}")
        print("\n💡 提示: 请先在本地电脑的命令行中执行以下操作进行打包:")
        print(f"  1) cd {os.path.join(LOCAL_APP_DIR, 'android')}")
        print("  2) ./gradlew assembleRelease")
        sys.exit(1)
        
    print(f"✅ 找到本地安装包: {LOCAL_APK_PATH}")
    print(f"文件大小: {os.path.getsize(LOCAL_APK_PATH) / 1024 / 1024:.2f} MB")
    
    # 2. 上传至前端服务器的下载目录
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"🔌 正在连接到前端服务器 {config.FRONTEND_HOST}...")
        ssh.connect(
            config.FRONTEND_HOST,
            port=config.FRONTEND_PORT,
            username=config.FRONTEND_USERNAME,
            password=config.FRONTEND_PASSWORD
        )
        
        # 确保下载目录存在（所有权为 ubuntu，直接创建无须 sudo）
        ssh.exec_command(f"mkdir -p {config.FRONTEND_DOWNLOAD_DIR}")
        
        sftp = ssh.open_sftp()
        print(f"📤 正在上传并分发 App 镜像 -> {REMOTE_APK_PATH}...")
        sftp.put(LOCAL_APK_PATH, REMOTE_APK_PATH)
        sftp.close()
        
        print("\n✨ App 安装包发布成功！")
        print(f"🔗 用户下载地址: https://{config.FRONTEND_HOST}/download/{REMOTE_APK_NAME} (或配置好的域名)")
        
    except Exception as e:
        print(f"\n❌ 连接或上传出错: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy_apk()
