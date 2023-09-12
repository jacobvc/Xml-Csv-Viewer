"use strict";
let nested = "Nested";
let incomeExpense = "Income-Expense";
let subtotal = "Subtotal";
let blankZeros = "Blank-Zeros";
let sorting = "sorting";
let highlight = "highlight";

let tableOptions = [
  {
    'name': incomeExpense, 'text': 'Indent inside Income/Expense rows',
    'description': 'Ident all rows that do not start with "Income Category" or "Expense Category"'
  },
  {
    'name': nested, 'text': 'Indent ":" separated names',
    'description': 'Indent colon separated names as a hierarchy'
  },
  {
    'name': subtotal, 'text': 'Append Subtotals', 'description':
      'Append subtotal rows (to indented numeric columns)'
  },
  {
    'name': blankZeros, 'text': 'Blank zero values',
    'description': 'Do not display any values that are "0"'
  },
  {
    'name': sorting, 'text': 'Sort columns', 'description':
      'Enable sorting by clicking column heading'
  },
  {
    'name': highlight, 'text': 'Highlight Concerns', 'description':
      'Highlight under-budget income and over-budget expenses'
  },
];

let incomeCategories = "INCOME CATEGORIES";
let expenseCategories = "EXPENSE CATEGORIES";

let doingExpense = false;


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

function getJsonColumnNames(item) {
  var columns = [];
  for (var name in item) {
    if (name !== '@attributes') {
      columns[name] = name;
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
    if (typeof (item[name]) === 'object') {
      var labelElem = document.createElement('label');
      labelElem.htmlFor = name;
      labelElem.textContent = decamelize(name);
      elem.appendChild(labelElem);
      createOnlyTable(item[name][Object.keys(item[name])[0]], elem, [], false, detailForm, []);
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
function createTable(data, elem, title, columns, noHeader, showDetail, highlightGroups, options) {
  if (data.length == 1) {
    if (showDetail) {
      showDetail(data[0]);
    }
    else {
      populateForm(data[0], title, elem);
    }
    return;
  }
  var titleElem = document.createElement('h3');
  titleElem.textContent = title;
  elem.appendChild(titleElem);
  createOnlyTable(data, elem, columns, noHeader, showDetail, highlightGroups, options)
}
function createOnlyTable(data, elem, columns, noHeader, showDetail, highlightGroups, options) {
  var table = document.createElement('table');
  elem.appendChild(table);
  if (columns.length == 0 && data.length > 0) {
    columns = getJsonColumnNames(data[0]);
  }
  if (!noHeader) {
    table.appendChild(createTableColumns(data, table, columns, options));
  }
  table.appendChild(addTableData(data, columns, showDetail, highlightGroups, options));
}

function createTableColumns(data, table, columns, options) {
  var thead = document.createElement('thead');

  if (data.length > 0) {
    var tr;
    tr = document.createElement('tr');
    Object.keys(columns).forEach(function (name) {
      var th = document.createElement('th');
      th.textContent = decamelize(name);
      tr.append(th);
    });
    thead.appendChild(tr);
  }

  if (sorting in options) {
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

function firstColumn(tr, indent, colName, clazz) {
  var td = document.createElement('td');
  td.style.left = indentStyle(indent);
  td.style.position = 'relative';
  td.textContent = colName;
  if (clazz) {
    td.classList.add(clazz);
  }
  tr.appendChild(td)
}

function nonFirstColumn(tr, value, clazz, clazz2) {
  var td = document.createElement('td');
  td.style.textAlign = 'right';
  td.textContent = value;
  if (clazz) {
    td.classList.add(clazz);
  }
  if (clazz2) {
    td.classList.add(clazz2);
  }
  tr.appendChild(td)
}

function appendNumericSubtotal(tr, indent, data, columns, start, end, highlightGroups, options) {
  firstColumn(tr, indent, "Subtotal", "subtotal");
  var subs = {};
  var nums = {};

  Object.keys(columns).forEach(function (key, col) {
    if (col > 0) { // Already did firstColumn
      nums[key] = 0;
      subs[key] = "";
      for (var i = start; i < end; i++) {
        let value = data[i][key];
        if (isNaN(value) || value.length == 0) {
          subs[key] = "";
          break;
        }
        else {
          nums[key] += Number(value);
          subs[key] = nums[key].toFixed(2);
        }
      }
    }
  });

  var tdClass = {}
  if (highlight in options) {
    highlightGroups.forEach(function (group) {
      if (Number(subs[group[0]]) != 0) {
        var result = columnSubtract(subs[group[0]], subs[group[1]]);
        if ((result.comparison < 0 && doingExpense) || (result.comparison > 0 && !doingExpense)) {
          group.forEach(function (column) {
            tdClass[column] = 'highlight';
          })
        }
      }
    });
  }


  Object.keys(columns).forEach(function (key, col) {
    if (col > 0) { // Already did firstColumn
      if (blankZeros in options && nums[key] == 0) {
        // Blank zero values
        nonFirstColumn(tr, '', "subtotal");
      }
      else {
        nonFirstColumn(tr, subs[key], "subtotal",
          tdClass[key] ? tdClass[key] : null);
      }
    }
  });
}

function columnSubtract(first, second) {
  let comparison = 0;
  let value = '';
  if (isNaN(second) || second.length == 0) {
    value = first;
  }
  else if (!isNaN(first) && first.length > 0) {
    let diff = Number(first) - Number(second);
    if (diff) {
      comparison = Math.sign(diff);
    }
    value = diff.toFixed(2);
  }
  return { value, comparison };
}

function addTableData(data, columns, showDetail, highlightGroups, options) {
  var tbody = document.createElement('tbody');

  var frag = document.createDocumentFragment(),
    row, cell;

  let indent = -1;
  let rootIndent = 0;
  let newIndent = -1;
  let startRows = [];
  let priorFields = [];

  // ALWAYS start doing income
  doingExpense = false;

  for (var i = 0; i < data.length; i++) {
    var tr = document.createElement('tr');
    tr.src = data[i];

    let colNum = 0;

    var tdClass = {}
    if (highlight in options) {
      highlightGroups.forEach(function (group) {
      if (Number(data[i][group[0]]) != 0) {
        var result = columnSubtract(data[i][group[0]], data[i][group[1]]);
        if ((result.comparison < 0 && doingExpense) || (result.comparison > 0 && !doingExpense)) {
          group.forEach(function (column) {
            tdClass[column] = 'highlight';
          })
        }
      }
    });
  }

    Object.keys(columns).forEach(function (name) {
      let value = data[i][name];
      var td = document.createElement('td');
      if (tdClass[name]) {
        td.classList.add(tdClass[name]);
      }

      if (colNum == 0) {
        if (nested in options && typeof value == 'string') {
          if (value.toUpperCase().startsWith(expenseCategories.toUpperCase())) {
            // Doing expense now
            doingExpense = true;
          }
          // Indent nested fields
          let fields = value.split(':');
          newIndent = fields.length - 1;

          // Find index of first difference
          let firstDiff = 0;
          for (firstDiff = 0;
            firstDiff < fields.length
            && firstDiff < priorFields.length; ++firstDiff) {
            if (fields[firstDiff] !== priorFields[firstDiff]) {
              break;
            }
          }

          if (indent > firstDiff) {
            // Append Subtotal for each 'ended' indent
            while (indent > firstDiff) {
              // Subtotal only if more than one line
              if (subtotal in options && i - startRows[indent] > 1) {
                appendNumericSubtotal(tr, rootIndent + indent, data, columns,
                  startRows[indent], i, highlightGroups, options);
                frag.appendChild(tr);
                tr = document.createElement('tr');
              }
              --indent;
            }
            // And set current indent to first NOT different
            --indent;
          }

          if (newIndent > indent) {
            value = '';
            // remember start row and set value
            ++indent;
            value = fields[indent];
            // Prior row (heading) is the subtotal start row
            startRows[indent] = i - 1;
            while (newIndent > indent + 1) {
              // This row is the subtotal start row (the heading is synthesized)
              startRows[indent] = i;
              firstColumn(tr, rootIndent + indent, fields[indent]);
              for (var col = 1; col < columns.length; ++col) {
                nonFirstColumn(tr, '');
              }
              ++indent;

              // Add missing header row
              frag.appendChild(tr);
              tr = document.createElement('tr');
            }
          }
          else {
            value = fields[newIndent];
          }
          priorFields = fields;
        }
        else {
          indent = 0;
        }

        // Set rootIndent AFTER appending Subtotal using prior indentation
        if (incomeExpense in options && typeof value == 'string'
          && !value.toUpperCase().startsWith(incomeCategories.toUpperCase())
          && !value.toUpperCase().startsWith(expenseCategories.toUpperCase())) {
          // Indent inside income/expense
          rootIndent = 1;
        }
        else {
          rootIndent = 0;
        }
        if (rootIndent + indent > 0) {
          // Apply visual indentation
          td.style.left = indentStyle(rootIndent + indent);
          td.style.position = 'relative';
        }
      }
      else {
        // All but first column align right
        td.style.textAlign = 'right';
      }
      if (blankZeros in options && value.trim() == '0') {
        // Blank zero values
        value = '';
      }
      td.dataset.propName = name;
      if (typeof (value) === 'object') {
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
  if (showDetail) {
    tbody.addEventListener('click', function (e) {
      showDetail(e.target.parentElement.src);
    }, false);
  }

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

