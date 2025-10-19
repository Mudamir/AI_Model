import subprocess
import sys
import os

def check_nvidia_drivers():
    """Check NVIDIA drivers and GPU status"""
    print("🔍 Checking NVIDIA GPU and drivers...")
    
    try:
        # Check nvidia-smi
        result = subprocess.run(['nvidia-smi'], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            print(" NVIDIA drivers installed")
            print("GPU Information:")
            lines = result.stdout.split('\n')
            for line in lines:
                if 'RTX' in line or 'GeForce' in line:
                    print(f"   {line.strip()}")
            return True
        else:
            print(" nvidia-smi not found or failed")
            return False
    except Exception as e:
        print(f" Error checking NVIDIA drivers: {e}")
        return False

def check_pytorch_cuda():
    """Check PyTorch CUDA support"""
    print("\n🔍 Checking PyTorch CUDA support...")
    
    try:
        import torch
        print(f"✅ PyTorch version: {torch.__version__}")
        print(f"CUDA available: {torch.cuda.is_available()}")
        
        if torch.cuda.is_available():
            print(f"CUDA version: {torch.version.cuda}")
            print(f"GPU count: {torch.cuda.device_count()}")
            for i in range(torch.cuda.device_count()):
                print(f"GPU {i}: {torch.cuda.get_device_name(i)}")
                props = torch.cuda.get_device_properties(i)
                print(f"   Memory: {props.total_memory / 1024**3:.1f}GB")
            return True
        else:
            print("❌ CUDA not available in PyTorch")
            print("💡 You may need to install PyTorch with CUDA support")
            return False
    except ImportError:
        print("❌ PyTorch not installed")
        return False

def check_ollama_gpu():
    """Check if Ollama can use GPU"""
    print("\n🔍 Checking Ollama GPU support...")
    
    try:
        import ollama
        
        # Test with a simple model call
        print("Testing Ollama GPU acceleration...")
        
        # Check if we can set GPU options
        models = ollama.list()
        if hasattr(models, 'models') and len(models.models) > 0:
            model_name = models.models[0].model
            print(f"Testing with model: {model_name}")
            
            # Test GPU usage
            response = ollama.chat(
                model=model_name,
                messages=[{'role': 'user', 'content': 'Hi'}],
                options={'num_gpu': -1}
            )
            print("✅ Ollama GPU options accepted")
            return True
        else:
            print("❌ No models available for testing")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Ollama GPU: {e}")
        return False

def install_pytorch_cuda():
    """Provide instructions for installing PyTorch with CUDA"""
    print("\n💡 To install PyTorch with CUDA support:")
    print("1. Uninstall current PyTorch:")
    print("   pip uninstall torch torchvision torchaudio")
    print("\n2. Install PyTorch with CUDA 12.1:")
    print("   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121")
    print("\n3. Or for CUDA 11.8:")
    print("   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118")

def main():
    print("🚀 GPU Diagnostic Tool for RTX 3050")
    print("="*50)
    
    # Check NVIDIA drivers
    nvidia_ok = check_nvidia_drivers()
    
    # Check PyTorch CUDA
    pytorch_ok = check_pytorch_cuda()
    
    # Check Ollama GPU
    ollama_ok = check_ollama_gpu()
    
    print("\n" + "="*50)
    print("📊 Summary:")
    print(f"NVIDIA Drivers: {'✅' if nvidia_ok else '❌'}")
    print(f"PyTorch CUDA: {'✅' if pytorch_ok else '❌'}")
    print(f"Ollama GPU: {'✅' if ollama_ok else '❌'}")
    
    if not nvidia_ok:
        print("\n🔧 Fix: Install/update NVIDIA drivers from GeForce Experience")
    
    if nvidia_ok and not pytorch_ok:
        print("\n🔧 Fix: Install PyTorch with CUDA support")
        install_pytorch_cuda()
    
    if nvidia_ok and pytorch_ok and not ollama_ok:
        print("\n🔧 Fix: Ollama should automatically use GPU when available")
        print("   Try restarting Ollama service")

if __name__ == "__main__":
    main()
