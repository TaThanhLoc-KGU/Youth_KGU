#!/usr/bin/env python3
"""
Convert React Query v3 syntax to v5 object syntax.

This script converts patterns like:
  useQuery(['key'], async () => {...}, {options})
To:
  useQuery({queryKey: ['key'], queryFn: async () => {...}, options})
"""

import re
import sys

def convert_use_query(content):
    """Convert useQuery from v3 to v5 syntax."""

    # Pattern to match useQuery calls with the old syntax
    # This handles multi-line useQuery calls
    pattern = r'useQuery\(\s*(\[[^\]]+\])\s*,\s*(async\s*\([^)]*\)\s*=>\s*\{(?:[^{}]|\{[^{}]*\})*\})\s*,\s*(\{[^}]*\})\s*\)'

    def replacer(match):
        query_key = match.group(1)
        query_fn = match.group(2)
        options = match.group(3)

        # Remove the outer braces from options
        options_inner = options[1:-1].strip()

        # Build the new syntax
        if options_inner:
            return f'useQuery({{\n    queryKey: {query_key},\n    queryFn: {query_fn},\n    {options_inner}\n  }})'
        else:
            return f'useQuery({{\n    queryKey: {query_key},\n    queryFn: {query_fn}\n  }})'

    # First try to match the full pattern
    converted = re.sub(pattern, replacer, content, flags=re.DOTALL)

    # Also handle simpler cases without options
    pattern_simple = r'useQuery\(\s*(\[[^\]]+\])\s*,\s*(async\s*\([^)]*\)\s*=>\s*\{(?:[^{}]|\{[^{}]*\})*\})\s*\)'

    def simple_replacer(match):
        query_key = match.group(1)
        query_fn = match.group(2)
        return f'useQuery({{\n    queryKey: {query_key},\n    queryFn: {query_fn}\n  }})'

    converted = re.sub(pattern_simple, simple_replacer, converted, flags=re.DOTALL)

    return converted

def main():
    if len(sys.argv) != 2:
        print("Usage: python convert_react_query.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Convert the content
        converted_content = convert_use_query(content)

        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(converted_content)

        print(f"Successfully converted {file_path}")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
