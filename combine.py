import sys
import os
import getopt

help = '''
Create a standalone html file, starting with a working html
file and one or more .js and .css files. Exclude the references
to those files and embed them by inserting the .js file 
contents before </script> and the .css file contents before </style>

usage: combine.py [-h][-o outputfilename] inputfilename js-or-css-filename[..]
'''

outfilename = 'combined.html'
outfile = ()


def insert_file(inputs, type):
    for filename in inputs:
        root, ext = os.path.splitext(filename)
        if ext == type:
            with open(filename, 'r') as file:
                outfile.write(file.read())


def combine(files):
    # Open text file in read only mode
    with open(files[0], 'r') as file:
        data = ''
        excluding = False
        Lines = file.readlines()

        count = 0

    inputs = files[1:]

    for line in Lines:
        # read the file line by line, excluding the EXCLUDE sections
        count += 1
        if line.lstrip().startswith('</script'):
            insert_file(inputs, ".js")

        elif line.lstrip().startswith('</style'):
            insert_file(inputs, ".css")
        else:
            for filename in inputs:
                if (line.find(filename) >= 0):
                    # Remove <link> or <script> include line
                    line = ''

        outfile.write(line)


# process command line arguments
arglist = sys.argv[1:]

# Options
options = "ho:"

# Long options
long_options = ["help", "output="]

try:
    # Parsing argument
    args, values = getopt.getopt(arglist, options, long_options)

    # checking each argument
    for arg, argv in args:

        if arg in ("-h", "--help"):
            print(help)
            exit()

        elif arg in ("-o", "--output"):
            print(("Output file: % s") % (argv))
            outfilename = argv

    outfile = open(outfilename, 'w')
    root, ext = os.path.splitext(outfilename)
    if (len(values) > 1):
        combine(values)
    else:
        print('Input and at least one combined filename required')

except getopt.error as err:
    # output error, and return with an error code
    print(str(err))
