import os

EXCLUDED_DIRS = {'.git', '.venv', '__pycache__', 'node_modules', '.idea', '.mypy_cache', '.pytest_cache'}

def print_tree(start_path, prefix=''):
    entries = [e for e in os.listdir(start_path) if not e.startswith('.') and e not in EXCLUDED_DIRS]
    entries.sort()
    for index, entry in enumerate(entries):
        path = os.path.join(start_path, entry)
        connector = '└── ' if index == len(entries) - 1 else '├── '
        print(prefix + connector + entry)
        if os.path.isdir(path):
            extension = '    ' if index == len(entries) - 1 else '│   '
            print_tree(path, prefix + extension)

if __name__ == '__main__':
    root_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"📂 Project Directory Tree from: {root_dir}\n")
    print_tree(root_dir)