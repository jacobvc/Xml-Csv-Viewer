# Xml-Csv-Viewer
Pure javascript web app to read and display / print CSV files, or 'tables' in XML files as HTML tables

Put all of the files in a singe directory and run index.html. The "Load File" button will browse for a file. Select the "Content" (table from XML File), checkmark desired columns / features, and press "(re)Display"

Complex fields are displayed as "[OBJECT]".

Clicking on any row of displayed data will display all of that row's values in a form view. Any complex ([OBJECT]) columns are expanded in that form view.

If you prefer a single file, the python script (executed fronm combine.bat) will generate a single file version named csv-xml-view.html
