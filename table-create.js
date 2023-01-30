"use strict";
let nested = "Nested";
let incomeExpense = "Income-Expense";
let subtotal = "Subtotal";
let blankZeros = "Blank-Zeros";
let sorting = "sorting";

let tableOptions = [
    {
        'name': nested, 'text': 'Indent ":" separated names',
        'description': 'Indent colon separated names as a hierarchy'
    },
    {
        'name': incomeExpense, 'text': 'Indent inside Income/Expense rows',
        'description': 'Ident all rows that do not start with "Income Category" or "Expense Category"'
    },
    {
        'name': blankZeros, 'text': 'Blank zero values',
        'description': 'Do not display any values that are "0"'
    },
    {
        'name': sorting, 'text': 'Sort columns', 'description':
            'Enable sorting by clicking column heading'
    },
    /*{ 'name' :  subtotal, 'text' : 'nested', 'description': 'nested tooltip' }, */
];

let incomeCategories = "INCOME CATEGORIES";
let expenseCategories = "EXPENSE CATEGORIES";

/*

    UTILITY

*/
function getJsonColumns(item) {
    var columns = [];
    for (var name in item) {
        if (name !== '@attributes') {
            columns.push(name);
        }
    }
    return columns;
}

function decamelize(name) {
    var out = name.substr(0, 1).toUpperCase();
    for (var i = 1; i < name.length; ++i) {
        if (name[i] == name[i].toUpperCase()) {
            if (i + 1 < name.length && name[i + 1] != name[i + 1].toUpperCase())
                out += " ";
        }
        out += name[i];
    }
    return out;
}

function indentStyle(steps) {
    return (steps * 15) + 'px';
}

/*

    FORM

*/
function populateForm(item, title, elem) {
    elem.replaceChildren();
    var titleElem = document.createElement('h2');
    titleElem.textContent = title;
    elem.appendChild(titleElem);

    var columns = getJsonColumns(item);
    var count = 0;
    columns.forEach(function (name) {
        if (typeof(item[name]) === 'object') {
            var labelElem = document.createElement('label');
            labelElem.htmlFor = name;
            labelElem.textContent = decamelize(name);
            elem.appendChild(labelElem);
            createOnlyTable(item[name][Object.keys(item[name])[0]], elem, [], detailForm, []);
        }
        else {
            addFormField(elem, name, decamelize(name), item[name]);
        }
        if ((count++ & 1) == 1) {
            elem.appendChild(document.createElement("br"));
        }
    });
}
function addFormField(elem, name, label, value) {
    var date = new Date(value)
    if (date.getTime() === date.getTime() && value.indexOf('-') > 0) {
        if (date.getFullYear() > 1) {
            value = date.toDateString();
        }
        else {
            value = '';
        }
    }

    var labelElem = document.createElement('label');
    labelElem.htmlFor = name;
    labelElem.textContent = label;

    var inputElem = document.createElement('input');
    inputElem.type = 'text';
    inputElem.id = name;
    inputElem.name = name;
    inputElem.value = value;
    inputElem.size = 20;

    elem.appendChild(labelElem);
    elem.appendChild(inputElem);
}

/*

    TABLE

*/
function createTable(data, elem, title, columns, onclick, options) {
    var titleElem = document.createElement('h2');
    titleElem.textContent = title;
    elem.appendChild(titleElem);
    createOnlyTable(data, elem, columns, onclick, options)
}
function createOnlyTable(data, elem, columns, onclick, options) {
    var table = document.createElement('table');
    elem.appendChild(table);
    if (columns.length == 0 && data.length > 0) {
        columns = getJsonColumns(data[0]);
    }
    table.appendChild(createTableColumns(data, table, columns, options));
    table.appendChild(addTableData(data, columns, onclick, options));
}

function createTableColumns(data, table, columns, options) {
    var thead = document.createElement('thead');

    if (data.length > 0) {
        var tr;
        tr = document.createElement('tr');
        columns.forEach(function (name) {
            var th = document.createElement('th');
            th.textContent = decamelize(name);
            tr.append(th);
        });
        thead.appendChild(tr);
    }

    if (options.indexOf(sorting) >= 0) {
        thead.addEventListener('click', function (e) {
            var t = e.target;

            if (!t.dataset.dir) { t.dataset.dir = 1; }
            else { t.dataset.dir *= -1; }
            // Remember the direction
            var tmpdir = t.dataset.dir;
            // Remove direction class fromn all headings
            for (var i = 0; i < tr.children.length; ++i) {
                var ch = tr.children[i];
                ch.classList.remove("ascending");
                ch.classList.remove("descending");
            }
            // Restore direction and set direction class for e.target
            t.dataset.dir = tmpdir;
            if (tmpdir > 0) {
                t.classList.add("ascending");
            }
            else if (tmpdir < 0) {
                t.classList.add("descending");
            }

            sortTableRows(table, t.cellIndex, t.dataset.dir);
        }, false);
    }
    return thead;
}

function addTableData(data, columns, onclick, options) {
    var tbody = document.createElement('tbody');

    var frag = document.createDocumentFragment(),
        row, cell;

    for (var i = 0; i < data.length; i++) {
        var tr = document.createElement('tr');
        tr.src = data[i];

        let colNum = 0;
        columns.forEach(function (name) {
            let value = data[i][name];
            let indent = 0;
            var td = document.createElement('td');

            if (colNum == 0) {
                if (options.indexOf(incomeExpense) >= 0
                    && !value.toUpperCase().startsWith(incomeCategories.toUpperCase())
                    && !value.toUpperCase().startsWith(expenseCategories.toUpperCase())) {
                    indent = 1;
                }
                if (options.indexOf(nested) >= 0) {
                    let fields = value.split(':');
                    indent += fields.length - 1;
                    value = fields[fields.length - 1];
                }
            }
            if (indent > 0) {
                td.style.left = indentStyle(indent);
                td.style.position = 'relative';
            }
            if (options.indexOf(blankZeros) >= 0
                && value.trim() == '0') {
                value = '';
            }
            td.dataset.propName = name;
            if (typeof(value) === 'object') {
                value = '[OBJECT]';
            }
            else {
                var date = new Date(value)
                if (date.getTime() === date.getTime() && value.indexOf('-') > 0) {
                    if (date.getFullYear() > 1) {
                        value = date.toDateString();
                    }
                }
            }
            td.textContent = value;
            tr.appendChild(td)
            ++colNum;
        });

        frag.appendChild(tr);
    }

    tbody.appendChild(frag);

    tbody.addEventListener('click', onclick, false);

    return tbody;
};

function sortTableRows(table, index, dir) {
    var switching = true;
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        var rows = table.rows;

        for (var i = 1; i < (rows.length - 1); i++) {
            //start by saying there should be no switching:
            var shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            var x = rows[i].cells[index].textContent;
            var y = rows[i + 1].cells[index].textContent;
            //check if the two rows should switch place:
            if ((dir > 0 && x.toLowerCase() > y.toLowerCase())
                || (dir < 0 && x.toLowerCase() < y.toLowerCase())) {
                //if so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch
            and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
};

