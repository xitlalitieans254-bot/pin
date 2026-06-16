import paramiko
import os
import zipfile
import subprocess
import sys
import shutil
import config

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# --- 本地与远程路径配置 ---
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WORKSPACE_ROOT = os.path.abspath(os.path.join(PROJECT_ROOT, ".."))
LOCAL_PROJECT_DIR = os.path.join(PROJECT_ROOT, "tt-zhipin-server")
ZIP_FILENAME = "backend_jars.zip"
REMOTE_ZIP = f"/home/{config.BACKEND_USERNAME}/{ZIP_FILENAME}"
REMOTE_RESTART_SCRIPT = f"{config.BACKEND_DIR}/restart.sh"

# 核心可执行包映射（模块名关键字 -> 目标重命名后的 jar 包名）
JAR_MAPPING = {
    "tt-zhipin-gateway": "tt-zhipin-gateway.jar",
    "tt-zhipin-im-netty-server": "tt-zhipin-im-netty-server.jar",
    "tt-zhipin-im-web": "tt-zhipin-im-web.jar"
}

MODULE_PATH_MAPPING = {
    "tt-zhipin-admin": "tt-zhipin-admin",
    "tt-zhipin-gateway": "tt-zhipin-gateway",
    "tt-zhipin-member": "tt-zhipin-member/tt-zhipin-member-web",
    "tt-zhipin-member-web": "tt-zhipin-member/tt-zhipin-member-web",
    "tt-zhipin-job": "tt-zhipin-job/tt-zhipin-job-web",
    "tt-zhipin-job-web": "tt-zhipin-job/tt-zhipin-job-web",
    "tt-zhipin-file": "tt-zhipin-file/tt-zhipin-file-web",
    "tt-zhipin-file-web": "tt-zhipin-file/tt-zhipin-file-web",
    "tt-zhipin-im-netty-server": "tt-zhipin-im/tt-zhipin-im-netty-server",
    "tt-zhipin-im-web": "tt-zhipin-im/tt-zhipin-im-web",
}

def selected_maven_modules():
    modules = []
    for key in JAR_MAPPING:
        module = MODULE_PATH_MAPPING.get(key)
        if module and module not in modules:
            modules.append(module)
    return modules

def find_bundled_java_home():
    candidates = []
    current_java_home = os.environ.get("JAVA_HOME")
    if current_java_home:
        candidates.append(current_java_home)

    for base_name in ["jdk17", "jdk8"]:
        base_dir = os.path.join(WORKSPACE_ROOT, base_name)
        candidates.append(base_dir)
        if os.path.isdir(base_dir):
            for child in os.listdir(base_dir):
                candidates.append(os.path.join(base_dir, child))

    java_bin = "java.exe" if os.name == "nt" else "java"
    for candidate in candidates:
        if candidate and os.path.exists(os.path.join(candidate, "bin", java_bin)):
            return candidate
    return None

def build_env():
    env = os.environ.copy()
    java_home = find_bundled_java_home()
    if java_home:
        env["JAVA_HOME"] = java_home
        env["PATH"] = os.path.join(java_home, "bin") + os.pathsep + env.get("PATH", "")
        print(f"使用 JAVA_HOME: {java_home}")
    else:
        print("警告: 未找到 JAVA_HOME 或根目录便携 JDK，将尝试使用系统 PATH 中的 java。")
    return env

def build_backend():
    # 检测 Maven 路径
    mvn_cmd = shutil.which("mvn") or "mvn"
    
    # 检查全局 PATH 里是否有 mvn
    if shutil.which("mvn") is None:
        # 全局 PATH 没有，尝试检查本地项目上级目录是否有免配置的 maven
        mvn_bin = "mvn.cmd" if os.name == "nt" else "mvn"
        local_mvn = os.path.join(WORKSPACE_ROOT, "apache-maven-3.9.6", "bin", mvn_bin)
        if os.path.exists(local_mvn):
            mvn_cmd = local_mvn
        else:
            print("❌ 错误: 未能在系统 PATH 中找到 'mvn' 命令，且工作区没有发现内置的 Maven。")
            print("💡 请等待我们内置下载的 Maven 部署完成后重试，或者手动配置环境变量。")
            sys.exit(1)

    modules = selected_maven_modules()
    module_args = f' -pl "{",".join(modules)}" -am' if modules else ""
    print(f"🔨 [1/5] 正在本地执行 Maven 打包 ({mvn_cmd}{module_args} clean package -DskipTests)...")
    if not os.path.exists(LOCAL_PROJECT_DIR):
        print(f"❌ 错误: 找不到本地项目目录 {LOCAL_PROJECT_DIR}")
        sys.exit(1)
        
    try:
        build_cmd = f'"{mvn_cmd}" -ntp{module_args} clean package -DskipTests'
        print(f"执行命令: {build_cmd} 于 {LOCAL_PROJECT_DIR}")
        subprocess.run(build_cmd, shell=True, check=True, cwd=LOCAL_PROJECT_DIR, env=build_env())
        print("✅ 本地 Java 后端打包成功！")
    except subprocess.CalledProcessError:
        print("❌ Maven 打包失败，请检查编译错误日志。")
        sys.exit(1)

def package_jars():
    print("📦 [2/5] 正在检索编译产物并重命名打包...")
    found_jars = {}
    
    # 扫描所有模块 target 目录下的 jar 包
    for root, dirs, files in os.walk(LOCAL_PROJECT_DIR):
        if "target" in root.split(os.sep):
            for file in files:
                if file.endswith(".jar") and not any(k in file for k in ["original", "sources", "javadoc"]):
                    file_path = os.path.join(root, file)
                    # 检查是否大于 5MB，过滤掉普通的 SDK/API jar 依赖包
                    if os.path.getsize(file_path) > 5 * 1024 * 1024:
                        # 匹配映射规则
                        for key, target_name in JAR_MAPPING.items():
                            if key in file:
                                found_jars[target_name] = file_path
                                break

    if not found_jars:
        print("❌ 错误: 未能在各模块 target 下找到任何符合要求的 Spring Boot 可执行 jar 包！")
        sys.exit(1)
        
    print(f"找到以下待部署的可执行包:")
    for target_name, path in found_jars.items():
        print(f" -> {target_name} ({os.path.getsize(path) / 1024 / 1024:.2f} MB)")
        
    # 写入压缩文件
    with zipfile.ZipFile(ZIP_FILENAME, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for target_name, path in found_jars.items():
            zipf.write(path, target_name)
            
    print(f"✅ 压缩包 {ZIP_FILENAME} 制作完成。")
    return list(found_jars.keys())

def create_remote_restart_script(jars_list):
    # 生成远端重启 shell 脚本
    jars_str = " ".join([f'"{jar}"' for jar in jars_list])
    script_content = f"""#!/bin/bash
# 自动生成的 Java 后端重启脚本
APP_DIR="{config.BACKEND_DIR}"
LOG_DIR="$APP_DIR/logs"
mkdir -p "$LOG_DIR"

JARS=({jars_str})

echo "================ 开始重启 Java 后端服务 ================"
for JAR in "${{JARS[@]}}"; do
    if [ -f "$APP_DIR/$JAR" ]; then
        PID=$(pgrep -f "$JAR")
        if [ -n "$PID" ]; then
            echo "🛑 正在停止 $JAR (PID: $PID)..."
            kill -15 "$PID"
            sleep 2
            kill -9 "$PID" 2>/dev/null || true
        fi
        
        echo "🚀 正在启动 $JAR..."
        # 设置环境变量以对接生产环境的数据库和配置中心
        export DB_HOST="127.0.0.1"
        export DB_PORT="3306"
        export DB_USER="root"
        export DB_PWD="Hello123456"
        export REDIS_HOST="127.0.0.1"
        export REDIS_PWD="Hello123456"
        export NACOS_ADDR="127.0.0.1:8848"
        export KAFKA_BOOTSTRAP_SERVERS="127.0.0.1:9092"
        export IM_WS_PORT="9000"
        export IM_TCP_PORT="6666"
        export IM_TIMEOUT_MS="2000"
        export IM_NODE_ID="node001"
        
        # 默认使用 prod 生产环境配置启动，并将日志输出到 logs/
        if [ "$JAR" = "tt-zhipin-gateway.jar" ]; then
            # 网关在 Nginx 中配置的反代端口是 8080，且非 root 用户无法直接绑定 80 端口
            nohup java -jar "$APP_DIR/$JAR" --spring.profiles.active=prod --server.port=8080 > "$LOG_DIR/${{JAR%.jar}}.log" 2>&1 &
        else
            nohup java -jar "$APP_DIR/$JAR" --spring.profiles.active=prod > "$LOG_DIR/${{JAR%.jar}}.log" 2>&1 &
        fi
        sleep 1
    else
        echo "⚠️ 警告: 未能在目录中找到 $JAR"
    fi
done

echo "=== 正在运行的 Java 服务状态 ==="
ps aux | grep java | grep -v grep
echo "========================================================"
"""
    
    # 临时写入本地文件
    local_script_path = "restart.sh"
    with open(local_script_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(script_content)
    
    return local_script_path

def deploy(local_script_path):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"🔌 [3/5] 正在连接到后端服务器 {config.BACKEND_HOST}...")
        ssh.connect(
            config.BACKEND_HOST,
            port=config.BACKEND_PORT,
            username=config.BACKEND_USERNAME,
            password=config.BACKEND_PASSWORD
        )
        
        # 上传文件
        sftp = ssh.open_sftp()
        print(f"📤 正在上传部署压缩包 {ZIP_FILENAME} -> {REMOTE_ZIP}...")
        sftp.put(ZIP_FILENAME, REMOTE_ZIP)
        
        # 确保后端目录存在
        print(f"📁 正在创建后端托管目录 {config.BACKEND_DIR}...")
        ssh.exec_command(f"mkdir -p {config.BACKEND_DIR}")
        
        print(f"📤 正在上传重启服务脚本 restart.sh -> {REMOTE_RESTART_SCRIPT}...")
        sftp.put(local_script_path, REMOTE_RESTART_SCRIPT)
        sftp.close()
        print("✅ 上传全部完成。")
        
        # 远程执行部署与解压
        print("🚀 [4/5] 正在远端服务器解压并启动 Java 服务...")
        commands = [
            # 1. 解压包覆盖到安装路径
            f"unzip -o {REMOTE_ZIP} -d {config.BACKEND_DIR}",
            # 2. 清理临时压缩包
            f"rm -f {REMOTE_ZIP}",
            # 3. 赋予重启脚本执行权限
            f"chmod +x {REMOTE_RESTART_SCRIPT}",
            # 4. 执行重启
            f"bash {REMOTE_RESTART_SCRIPT}"
        ]
        
        full_command = " && ".join(commands)
        stdin, stdout, stderr = ssh.exec_command(full_command, get_pty=True)
        
        # 实时打印服务器输出
        print("\n--- 服务器部署输出日志 ---")
        for line in iter(stdout.readline, ""):
            print(line, end="")
            
        exit_status = stdout.channel.recv_exit_status()
        if exit_status == 0:
            print("\n✨ [5/5] tt-zhipin 后端服务部署成功！")
        else:
            print(f"\n❌ [5/5] 后端服务部署重启失败 (Exit Code: {exit_status})")
            print("错误信息:\n", stderr.read().decode())

    except Exception as e:
        print(f"\n❌ 连接或部署出错: {str(e)}")
    finally:
        ssh.close()
        # 清理本地临时文件
        for temp_file in [ZIP_FILENAME, local_script_path]:
            if os.path.exists(temp_file):
                os.remove(temp_file)

if __name__ == "__main__":
    build_backend()
    jars_list = package_jars()
    local_script = create_remote_restart_script(jars_list)
    deploy(local_script)
