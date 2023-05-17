# Xml-Csv-Viewer
Pure javascript web app(s) to read and display / print CSV files, or 'tables' in XML files as HTML tables

Put all of the files in a singe directory and run xmlcsv.html. The "Load File" button will browse for a file. Select the "Content" (table from XML File), checkmark desired columns / features, and press "(re)Display"

## xmlcsv.html
### standalone/CmlCsvReader.html

## churchtrac.html
### standalone/ChurchTracBudgetReport.html
## Support files

### xml-convert.js
### options.js
### table-create.js

Complex fields are displayed as "[OBJECT]".
Clicking on any row of displayed data will display all of that row's values in a form view. Any complex ([OBJECT]) columns are expanded in that form view.

## Tools
### combine.py / combine.bat
The python script (typically executed from combine.bat) generates a standalone (single file versions of
the) html files into the standalone directory.

