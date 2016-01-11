#!/usr/bin/env python
from __future__ import print_function

import glob
import json
import os
import sys
import xml.etree.ElementTree as ET

def list_entry_files(path):
    filenames_unsorted = glob.glob(os.path.join(path, '*.xml'))
    filenames = sorted(filenames_unsorted)[::-1]
    return filenames

def parse_entry_file(path):
    tree = ET.parse(path)
    title = tree.getroot().find('title').text
    tags = [el.text for el in tree.getroot().findall('tag')]
    return {'filename': os.path.basename(path), 'title': title, 'tags': tags}

def main():
    if len(sys.argv) < 2:
        sys.exit('Usage: ' + sys.argv[0] + ' path')

    entries_path = sys.argv[1]
    data = [parse_entry_file(entry_file) for entry_file in list_entry_files(entries_path)[::-1]]
    with open(os.path.join(entries_path, 'entries.json'), 'w') as f:
        f.write(json.dumps(data, indent=2, ensure_ascii=False).encode('utf8'))

if __name__ == '__main__':
    main()
