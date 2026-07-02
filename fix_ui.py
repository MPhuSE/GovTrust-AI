import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Remove ambient backgrounds and blur elements
    # content = re.sub(r'<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">.*?</div>\s*</div>', '', content, flags=re.DOTALL)
    # content = re.sub(r'<div className="absolute inset-0 pointer-events-none">.*?</div>\s*</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'backdrop-blur-xl', '', content)
    content = re.sub(r'backdrop-blur', '', content)

    # 2. Fix big rounded corners to standard small corners
    content = re.sub(r'rounded-2xl', 'rounded-md', content)
    content = re.sub(r'rounded-3xl', 'rounded-md', content)
    content = re.sub(r'rounded-\[2rem\]', 'rounded-md', content)
    content = re.sub(r'rounded-xl', 'rounded', content)

    # 3. Replace text gradients with flat teal-700 (which is mapped to Red)
    content = re.sub(r'text-transparent bg-clip-text bg-gradient-to-r from-[a-z0-9\-]+ to-[a-z0-9\-]+', 'text-teal-700', content)
    
    # 4. Replace hardcoded #0A192F (Navy) and #112240 with teal-700 (Red) or gold-500 (Yellow) for buttons
    content = re.sub(r'bg-\[\#0A192F\]', 'bg-teal-700', content)
    content = re.sub(r'hover:bg-\[\#112240\]', 'hover:bg-teal-800', content)
    content = re.sub(r'text-\[\#0A192F\]', 'text-teal-700', content)
    
    # 5. Fix emerald/cyan elements to teal (Red) or gold (Yellow)
    content = re.sub(r'bg-emerald-600', 'bg-teal-600', content)
    content = re.sub(r'hover:bg-emerald-700', 'hover:bg-teal-700', content)
    content = re.sub(r'text-emerald-600', 'text-teal-600', content)
    content = re.sub(r'hover:text-emerald-700', 'hover:text-teal-700', content)
    content = re.sub(r'text-emerald-500', 'text-teal-600', content)
    content = re.sub(r'bg-emerald-50', 'bg-gray-50', content)
    content = re.sub(r'border-emerald-[0-9]+', 'border-teal-600', content)
    content = re.sub(r'ring-emerald-[0-9]+/[0-9]+', 'ring-teal-500/20', content)
    content = re.sub(r'text-emerald-400', 'text-teal-500', content)

    # 6. Replace logo specific styling
    # <div className="w-16 h-16 bg-white border border-gray-100 rounded-md flex items-center justify-center mx-auto mb-5 shadow-sm">
    #   <span className="text-teal-700 font-extrabold text-2xl">G</span>
    # </div>
    # Convert this to a star logo
    star_logo = '''<div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center border-4 border-gold-500 shadow-sm relative overflow-hidden mx-auto mb-4">
            <span className="text-gold-500 text-3xl">★</span>
          </div>'''
    content = re.sub(r'<div className="w-\d+ h-\d+ bg-white border border-gray-100 rounded-md flex items-center justify-center mx-auto mb-\d+ shadow-sm">\s*<span className="[^"]+">G</span>\s*</div>', star_logo, content)

    # 7. Replace bg-[#FBFBFA] with bg-gray-50
    content = re.sub(r'bg-\[\#FBFBFA\]', 'bg-gray-50', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('apps/web/src/app'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
