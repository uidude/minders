/**
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const googleapis = require('googleapis');
const minderUtils = require('./minder-utils');

module.exports = function(req, oauthClient, callback) {
  var newList = JSON.parse(JSON.stringify(NEW_LIST_TEMPLATE));

  newList.properties.title = req.title;
  googleapis.sheets('v4').spreadsheets.create({
    resource: newList,
    auth: oauthClient
  }, function(err, resp) {
    callback(err, resp ? {id: resp.spreadsheetId, title: resp.properties.title} : null);
  });
};


var NEW_LIST_TEMPLATE = {
  'spreadsheetId': '',
  'properties': {
    'title': 'noobie',
    'locale': 'en_US',
    'autoRecalc': 'ON_CHANGE',
    'timeZone': 'Etc/GMT',
    'defaultFormat': {
      'backgroundColor': {'red': 1, 'green': 1, 'blue': 1},
      'padding': {'top': 2, 'right': 3, 'bottom': 2, 'left': 3},
      'verticalAlignment': 'BOTTOM',
      'wrapStrategy': 'OVERFLOW_CELL',
      'textFormat': {
        'foregroundColor': {},
        'fontFamily': 'arial,sans,sans-serif',
        'fontSize': 10,
        'bold': false,
        'italic': false,
        'strikethrough': false,
        'underline': false
      }
    }
  },
  'sheets': [
    {
      'properties': {
        'sheetId': 194779727,
        'title': 'Minders',
        'index': 0,
        'sheetType': 'GRID',
        'gridProperties': {'rowCount': 2, 'columnCount': 9, 'frozenRowCount': 1}
      },
      'data': [{
        'rowData': [
          {
            'values': [
              {
                'userEnteredValue': {'stringValue': 'Priority'},
                'formattedValue': 'Priority',
                'userEnteredFormat': {
                  'horizontalAlignment': 'CENTER',
                  'textFormat': {'bold': true}
                }
              },
              {
                'userEnteredValue': {'stringValue': 'Topic'},
                'formattedValue': 'Topic',
                'userEnteredFormat': {'textFormat': {'bold': true}}
              },
              {
                'userEnteredValue': {'stringValue': 'Created On'},
                'formattedValue': 'Created On',
                'userEnteredFormat': {
                  'numberFormat': {'type': 'DATE', 'pattern': 'm"/"d"/"yy'},
                  'horizontalAlignment': 'CENTER',
                  'wrapStrategy': 'WRAP',
                  'textFormat': {'bold': true}
                }
              },
              {
                'userEnteredValue': {'stringValue': 'Closed On'},
                'formattedValue': 'Closed On',
                'userEnteredFormat': {
                  'numberFormat': {'type': 'DATE', 'pattern': 'm"/"d"/"yy'},
                  'horizontalAlignment': 'CENTER',
                  'wrapStrategy': 'WRAP',
                  'textFormat': {'bold': true}
                }
              },
              {
                'userEnteredValue': {'stringValue': 'Snooze Til'},
                'formattedValue': 'Snooze Til',
                'userEnteredFormat': {
                  'numberFormat': {'type': 'DATE', 'pattern': 'm"/"d"/"yy'},
                  'horizontalAlignment': 'CENTER',
                  'wrapStrategy': 'WRAP',
                  'textFormat': {'bold': true}
                }
              },
              {
                'userEnteredValue': {'stringValue': 'S?'},
                'formattedValue': 'S?',
                'userEnteredFormat': {
                  'horizontalAlignment': 'CENTER',
                  'textFormat': {'bold': true}
                }
              },
              {
                'userEnteredValue': {'stringValue': 'ID'},
                'formattedValue': 'ID',
                'userEnteredFormat': {
                  'numberFormat': {'type': 'NUMBER', 'pattern': '0'},
                  'horizontalAlignment': 'CENTER',
                  'wrapStrategy': 'CLIP',
                  'textFormat': {'bold': true}
                }
              },
              {
                'userEnteredValue': {'stringValue': 'R'},
                'formattedValue': 'R',
                'userEnteredFormat': {
                  'numberFormat': {'type': 'NUMBER', 'pattern': '0'},
                  'horizontalAlignment': 'CENTER',
                  'textFormat': {'bold': true}
                }
              },
              {
                'userEnteredValue': {'stringValue': 'Last Mod'},
                'userEnteredFormat': {
                  'numberFormat': {'type': 'DATE', 'pattern': 'm"/"d"/"yy'},
                  'horizontalAlignment': 'CENTER',
                  'wrapStrategy': 'WRAP',
                  'textFormat': {'bold': true}
                }
              }
            ]
          },
          {
            'values': [
              {
                'userEnteredValue': {'stringValue': '-new'},
                'formattedValue': '-new',
                'userEnteredFormat': {
                  'borders': {
                    'bottom': {
                      'style': 'SOLID',
                      'width': 1,
                      'color': {
                        'red': 0.9372549,
                        'green': 0.9372549,
                        'blue': 0.9372549
                      }
                    },
                    'left': {
                      'style': 'SOLID',
                      'width': 1,
                      'color': {
                        'red': 0.7176471,
                        'green': 0.7176471,
                        'blue': 0.7176471
                      }
                    },
                    'right': {
                      'style': 'SOLID',
                      'width': 1,
                      'color': {
                        'red': 0.9372549,
                        'green': 0.9372549,
                        'blue': 0.9372549
                      }
                    }
                  },
                  'horizontalAlignment': 'CENTER',
                  'verticalAlignment': 'BOTTOM',
                  'textFormat': {'fontFamily': 'arial,sans,sans-serif'}
                },
                'dataValidation': {
                  'condition': {
                    'type': 'ONE_OF_RANGE',
                    'values': [{'userEnteredValue': '=Restates'}]
                  },
                  'showCustomUi': true
                }
              },
              {
                'userEnteredValue':
                    {'stringValue': 'Your first minder—click plus for another'},
              },
              {
                'userEnteredValue': {'numberValue': 25852},
                'formattedValue': '10/11/70',
                'userEnteredFormat': {
                  'numberFormat': {'type': 'DATE', 'pattern': 'm"/"d"/"yy'},
                  'borders': {
                    'bottom': {
                      'style': 'SOLID',
                      'width': 1,
                      'color': {
                        'red': 0.9372549,
                        'green': 0.9372549,
                        'blue': 0.9372549
                      }
                    },
                    'right': {
                      'style': 'SOLID',
                      'width': 1,
                      'color': {
                        'red': 0.9372549,
                        'green': 0.9372549,
                        'blue': 0.9372549
                      }
                    }
                  },
                  'horizontalAlignment': 'CENTER',
                  'verticalAlignment': 'BOTTOM',
                  'textFormat': {'fontFamily': 'arial,sans,sans-serif'}
                }
              },
              {
                'userEnteredFormat': {
                  'numberFormat': {'type': 'DATE', 'pattern': 'm"/"d"/"yy'},
                  'borders': {
                    'bottom': {
                      'style': 'SOLID',
                      'width': 1,
                      'color': {
                        'red': 0.9372549,
                        'green': 0.9372549,
                        'blue': 0.9372549
                      }
                    },
                    'right': {
                      'style': 'SOLID',
                      'width': 1,
                      'color': {
                        'red': 0.9372549,
                        'green': 0.9372549,
                        'blue': 0.9372549
                      }
                    }
                  },
                  'horizontalAlignment': 'CENTER',
                  'verticalAlignment': 'BOTTOM',
                  'textFormat': {'fontFamily': 'arial,sans,sans-serif'}
                }
              },
              {
                'userEnteredFormat': {
                  'numberFormat': {'type': 'DATE', 'pattern': 'm"/"d"/"yy'},
                  'borders': {
                    'bottom': {
                      'style': 'SOLID',
                      'width': 1,
                      'color': {
                        'red': 0.9372549,
                        'green': 0.9372549,
                        'blue': 0.9372549
                      }
                    },
                    'right': {
                      'style': 'SOLID',
                      'width': 1,
                      'color': {
                        'red': 0.9372549,
                        'green': 0.9372549,
                        'blue': 0.9372549
                      }
                    }
                  },
                  'horizontalAlignment': 'CENTER',
                  'verticalAlignment': 'BOTTOM',
                  'textFormat': {'fontFamily': 'arial,sans,sans-serif'}
                }
              },
              {
                'userEnteredValue':
                    {'formulaValue': '=ARRAYFORMULA(IF(E2:E>TODAY(), "Y",""))'},
                'userEnteredFormat': {
                  'numberFormat':
                      {'type': 'DATE_TIME', 'pattern': 'M/d/yyyy H:mm:ss'},
                  'backgroundColor': {'red': 1, 'green': 1, 'blue': 1},
                  'horizontalAlignment': 'CENTER',
                  'textFormat': {
                    'foregroundColor': {},
                    'fontFamily':
                        'Inconsolata, monospace, arial, sans, sans-serif',
                    'fontSize': 11
                  }
                }
              },
              {
                'userEnteredValue': {'stringValue': '631609043-291919139'},
                'formattedValue': '631609043-291919139',
                'userEnteredFormat': {
                  'numberFormat': {'type': 'NUMBER', 'pattern': '0'},
                  'backgroundColor': {'red': 1, 'green': 1, 'blue': 1},
                  'horizontalAlignment': 'LEFT',
                  'wrapStrategy': 'CLIP',
                  'textFormat': {
                    'foregroundColor': {},
                    'fontFamily':
                        'Inconsolata, monospace, arial, sans, sans-serif',
                    'fontSize': 11
                  }
                }
              },
              {
                'userEnteredValue':
                    {'formulaValue': '=ARRAYFORMULA(ROW(A2:A))'},
                'formattedValue': '2',
                'userEnteredFormat': {
                  'numberFormat': {'type': 'NUMBER', 'pattern': '0'},
                  'backgroundColor': {'red': 1, 'green': 1, 'blue': 1},
                  'horizontalAlignment': 'CENTER',
                  'textFormat': {
                    'foregroundColor': {},
                    'fontFamily':
                        'Inconsolata, monospace, arial, sans, sans-serif',
                    'fontSize': 11
                  }
                }
              },
              {
                'userEnteredFormat': {
                  'numberFormat': {'type': 'DATE', 'pattern': 'm"/"d"/"yy'},
                  'borders': {
                    'bottom': {
                      'style': 'SOLID',
                      'width': 1,
                      'color': {
                        'red': 0.9372549,
                        'green': 0.9372549,
                        'blue': 0.9372549
                      }
                    },
                    'right': {
                      'style': 'SOLID',
                      'width': 1,
                      'color': {
                        'red': 0.9372549,
                        'green': 0.9372549,
                        'blue': 0.9372549
                      }
                    }
                  },
                  'horizontalAlignment': 'CENTER',
                  'verticalAlignment': 'BOTTOM',
                  'textFormat': {'fontFamily': 'arial,sans,sans-serif'}
                }
              }
            ]
          }
        ],
        'rowMetadata': [{'pixelSize': 21}, {'pixelSize': 21}],
        'columnMetadata': [
          {'pixelSize': 94}, {'pixelSize': 372}, {'pixelSize': 77},
          {'pixelSize': 77}, {'pixelSize': 77}, {'pixelSize': 33},
          {'pixelSize': 33}, {'pixelSize': 33}, {'pixelSize': 77}
        ]
      }],
      'conditionalFormats': [
        {
          'ranges': [{
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 1
          }],
          'booleanRule': {
            'condition': {
              'type': 'TEXT_CONTAINS',
              'values': [{'userEnteredValue': '1-current'}]
            },
            'format': {
              'backgroundColor':
                  {'red': 0.41568628, 'green': 0.65882355, 'blue': 0.30980393},
              'textFormat':
                  {'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}}
            }
          }
        },
        {
          'ranges': [{
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 1
          }],
          'booleanRule': {
            'condition': {
              'type': 'TEXT_CONTAINS',
              'values': [{'userEnteredValue': '2-soon'}]
            },
            'format': {
              'backgroundColor':
                  {'red': 0.7137255, 'green': 0.84313726, 'blue': 0.65882355},
              'textFormat': {
                'foregroundColor':
                    {'red': 0.2627451, 'green': 0.2627451, 'blue': 0.2627451}
              }
            }
          }
        },
        {
          'ranges': [{
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 1
          }],
          'booleanRule': {
            'condition': {
              'type': 'TEXT_CONTAINS',
              'values': [{'userEnteredValue': '0-urgent'}]
            },
            'format': {
              'backgroundColor':
                  {'red': 0.8, 'green': 0.25490198, 'blue': 0.14509805},
              'textFormat':
                  {'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}}
            }
          }
        },
        {
          'ranges': [{
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 1
          }],
          'booleanRule': {
            'condition': {
              'type': 'TEXT_CONTAINS',
              'values': [{'userEnteredValue': 'to read'}]
            },
            'format':
                {'backgroundColor': {'red': 1, 'green': 0.8980392, 'blue': 0.6}}
          }
        },
        {
          'ranges': [{
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 1
          }],
          'booleanRule': {
            'condition': {
              'type': 'TEXT_CONTAINS',
              'values': [{'userEnteredValue': '1-waiting'}]
            },
            'format': {
              'backgroundColor': {'red': 0.91764706, 'green': 0.6, 'blue': 0.6},
              'textFormat':
                  {'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}}
            }
          }
        },
        {
          'ranges': [{
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 1
          }],
          'booleanRule': {
            'condition': {
              'type': 'TEXT_CONTAINS',
              'values': [{'userEnteredValue': 'remember'}]
            },
            'format': {
              'backgroundColor':
                  {'red': 0.7176471, 'green': 0.88235295, 'blue': 0.8039216}
            }
          }
        },
        {
          'ranges': [{
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 1
          }],
          'booleanRule': {
            'condition':
                {'type': 'TEXT_EQ', 'values': [{'userEnteredValue': '-new'}]},
            'format': {
              'backgroundColor':
                  {'red': 0.9019608, 'green': 0.5686275, 'blue': 0.21960784},
              'textFormat':
                  {'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}}
            }
          }
        },
        {
          'ranges': [{
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 1
          }],
          'booleanRule': {
            'condition':
                {'type': 'TEXT_EQ', 'values': [{'userEnteredValue': 'closed'}]},
            'format': {
              'backgroundColor':
                  {'red': 0.9372549, 'green': 0.9372549, 'blue': 0.9372549},
              'textFormat':
                  {'foregroundColor': {'red': 0.4, 'green': 0.4, 'blue': 0.4}}
            }
          }
        }
      ],
      'filterViews': [
        {
          'filterViewId': 1496670599,
          'title': 'Top',
          'range': {
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 6
          },
          'sortSpecs': [{'sortOrder': 'ASCENDING'}],
          'criteria': {
            '0': {
              'hiddenValues': [
                '2-now', '3-soon', '4-later', 'closed', 'meeting', 'obsolete',
                'waiting'
              ]
            },
            '5': {'hiddenValues': ['Y']}
          }
        },
        {
          'filterViewId': 573436354,
          'title': 'Closed',
          'range': {
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 6
          },
          'sortSpecs': [{'dimensionIndex': 3, 'sortOrder': 'DESCENDING'}],
          'criteria': {
            '0': {
              'hiddenValues':
                  ['0-urgent', '1-current', '1-waiting', '2-soon', 'obsolete']
            }
          }
        },
        {
          'filterViewId': 715444118,
          'title': 'Today',
          'range': {
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 6
          },
          'sortSpecs': [{'sortOrder': 'ASCENDING'}],
          'criteria': {
            '0': {
              'hiddenValues': [
                '3-later', '4-attic', 'remember', 'to read', '2-now', '3-soon',
                'closed', 'meeting', 'obsolete'
              ]
            },
            '5': {'hiddenValues': ['Y']}
          }
        },
        {
          'filterViewId': 1164382728,
          'title': 'Today (inc Snoozed)',
          'range': {
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 6
          },
          'sortSpecs': [{'sortOrder': 'ASCENDING'}],
          'criteria': {
            '0': {
              'hiddenValues':
                  ['1-top', '2-now', '3-soon', 'closed', 'meeting', 'obsolete']
            }
          }
        },
        {
          'filterViewId': 629709945,
          'title': 'Today (only)',
          'range': {
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 6
          },
          'sortSpecs': [{'sortOrder': 'ASCENDING'}],
          'criteria': {
            '0': {
              'hiddenValues': [
                '4-attic', 'remember', '1-waiting', '2-now', '2-soon',
                '3-later', '3-soon', 'closed', 'meeting', 'obsolete', 'to read'
              ]
            }
          }
        },
        {
          'filterViewId': 1094619041,
          'title': 'Open',
          'range': {
            'sheetId': 194779727,
            'startRowIndex': 0,
            'endRowIndex': 2,
            'startColumnIndex': 0,
            'endColumnIndex': 6
          },
          'criteria': {'0': {'hiddenValues': ['closed', 'obsolete']}}
        }
      ]
    },
    {
      'properties': {
        'sheetId': 115221394,
        'title': 'Legend',
        'index': 1,
        'sheetType': 'GRID',
        'gridProperties': {'rowCount': 11, 'columnCount': 1},
        'hidden': true
      },
      'data': [{
        'rowData': [
          {
            'values': [{
              'userEnteredValue': {'stringValue': '-new'},
              'formattedValue': '-new',
              'userEnteredFormat': {
                'horizontalAlignment': 'CENTER',
                'verticalAlignment': 'BOTTOM',
                'textFormat': {
                  'foregroundColor': {
                    'red': 0.52156866,
                    'green': 0.1254902,
                    'blue': 0.047058824
                  },
                  'fontFamily': 'arial,sans,sans-serif',
                  'bold': true
                }
              }
            }]
          },
          {
            'values': [{
              'userEnteredValue': {'stringValue': '0-urgent'},
              'formattedValue': '0-urgent',
              'userEnteredFormat': {
                'horizontalAlignment': 'CENTER',
                'verticalAlignment': 'BOTTOM',
                'textFormat': {
                  'foregroundColor': {
                    'red': 0.52156866,
                    'green': 0.1254902,
                    'blue': 0.047058824
                  },
                  'fontFamily': 'arial,sans,sans-serif',
                  'bold': true
                }
              }
            }]
          },
          {
            'values': [{
              'userEnteredValue': {'stringValue': '1-current'},
              'formattedValue': '1-current',
              'userEnteredFormat': {
                'horizontalAlignment': 'CENTER',
                'verticalAlignment': 'BOTTOM',
                'textFormat': {
                  'foregroundColor': {
                    'red': 0.52156866,
                    'green': 0.1254902,
                    'blue': 0.047058824
                  },
                  'fontFamily': 'arial,sans,sans-serif',
                  'bold': true
                }
              }
            }]
          },
          {
            'values': [{
              'userEnteredValue': {'stringValue': '1-waiting'},
              'formattedValue': '1-waiting',
              'userEnteredFormat': {
                'horizontalAlignment': 'CENTER',
                'verticalAlignment': 'BOTTOM',
                'textFormat': {
                  'foregroundColor': {
                    'red': 0.52156866,
                    'green': 0.1254902,
                    'blue': 0.047058824
                  },
                  'fontFamily': 'arial,sans,sans-serif',
                  'bold': true
                }
              }
            }]
          },
          {
            'values': [{
              'userEnteredValue': {'stringValue': '2-soon'},
              'formattedValue': '2-soon',
              'userEnteredFormat': {
                'horizontalAlignment': 'CENTER',
                'verticalAlignment': 'BOTTOM',
                'textFormat': {
                  'foregroundColor': {
                    'red': 0.52156866,
                    'green': 0.1254902,
                    'blue': 0.047058824
                  },
                  'fontFamily': 'arial,sans,sans-serif',
                  'bold': true
                }
              }
            }]
          },
          {
            'values': [{
              'userEnteredValue': {'stringValue': '3-later'},
              'formattedValue': '3-later',
              'userEnteredFormat': {
                'horizontalAlignment': 'CENTER',
                'verticalAlignment': 'BOTTOM',
                'textFormat': {
                  'foregroundColor': {
                    'red': 0.52156866,
                    'green': 0.1254902,
                    'blue': 0.047058824
                  },
                  'fontFamily': 'arial,sans,sans-serif',
                  'bold': true
                }
              }
            }]
          },
          {
            'values': [{
              'userEnteredValue': {'stringValue': '4-attic'},
              'formattedValue': '4-attic',
              'userEnteredFormat': {
                'horizontalAlignment': 'CENTER',
                'verticalAlignment': 'BOTTOM',
                'textFormat': {
                  'foregroundColor': {
                    'red': 0.52156866,
                    'green': 0.1254902,
                    'blue': 0.047058824
                  },
                  'fontFamily': 'arial,sans,sans-serif',
                  'bold': true
                }
              }
            }]
          },
          {
            'values': [{
              'userEnteredValue': {'stringValue': 'waiting'},
              'formattedValue': 'waiting',
              'userEnteredFormat': {
                'horizontalAlignment': 'CENTER',
                'verticalAlignment': 'BOTTOM',
                'textFormat': {
                  'foregroundColor': {
                    'red': 0.52156866,
                    'green': 0.1254902,
                    'blue': 0.047058824
                  },
                  'fontFamily': 'arial,sans,sans-serif',
                  'bold': true
                }
              }
            }]
          },
          {
            'values': [{
              'userEnteredValue': {'stringValue': 'meeting'},
              'formattedValue': 'meeting',
              'userEnteredFormat': {
                'horizontalAlignment': 'CENTER',
                'verticalAlignment': 'BOTTOM',
                'textFormat': {
                  'foregroundColor': {
                    'red': 0.52156866,
                    'green': 0.1254902,
                    'blue': 0.047058824
                  },
                  'fontFamily': 'arial,sans,sans-serif',
                  'bold': true
                }
              }
            }]
          },
          {
            'values': [{
              'userEnteredValue': {'stringValue': 'closed'},
              'formattedValue': 'closed',
              'userEnteredFormat': {
                'horizontalAlignment': 'CENTER',
                'verticalAlignment': 'BOTTOM',
                'textFormat': {
                  'foregroundColor': {
                    'red': 0.52156866,
                    'green': 0.1254902,
                    'blue': 0.047058824
                  },
                  'fontFamily': 'arial,sans,sans-serif',
                  'bold': true
                }
              }
            }]
          },
          {
            'values': [{
              'userEnteredValue': {'stringValue': 'obsolete'},
              'formattedValue': 'obsolete',
              'userEnteredFormat': {
                'horizontalAlignment': 'CENTER',
                'verticalAlignment': 'BOTTOM',
                'textFormat': {
                  'foregroundColor': {
                    'red': 0.52156866,
                    'green': 0.1254902,
                    'blue': 0.047058824
                  },
                  'fontFamily': 'arial,sans,sans-serif',
                  'bold': true
                }
              }
            }]
          }
        ],
        'rowMetadata': [
          {'pixelSize': 21}, {'pixelSize': 21}, {'pixelSize': 21},
          {'pixelSize': 21}, {'pixelSize': 21}, {'pixelSize': 21},
          {'pixelSize': 21}, {'pixelSize': 21}, {'pixelSize': 21},
          {'pixelSize': 21}, {'pixelSize': 21}
        ],
        'columnMetadata': [{'pixelSize': 100}]
      }]
    }
  ],
  'namedRanges': [
    {
      'namedRangeId': 'm1xwqz9kmab9',
      'name': 'ID',
      'range':
          {'sheetId': 194779727, 'startColumnIndex': 6, 'endColumnIndex': 7}
    },
    {
      'namedRangeId': '391986406',
      'name': 'ClosedOn',
      'range':
          {'sheetId': 194779727, 'startColumnIndex': 3, 'endColumnIndex': 4}
    },
    {
      'namedRangeId': '577943053',
      'name': 'SnoozeTil',
      'range':
          {'sheetId': 194779727, 'startColumnIndex': 4, 'endColumnIndex': 5}
    },
    {
      'namedRangeId': '1639339091',
      'name': 'CreatedOn',
      'range':
          {'sheetId': 194779727, 'startColumnIndex': 2, 'endColumnIndex': 3}
    },
    {
      'namedRangeId': '1116944284',
      'name': 'States',
      'range': {
        'sheetId': 115221394,
        'startRowIndex': 0,
        'endRowIndex': 11,
        'startColumnIndex': 0,
        'endColumnIndex': 1
      }
    },
    {
      'namedRangeId': 'bt5fffjgkf7q',
      'name': 'Restates',
      'range': {
        'sheetId': 115221394,
        'startRowIndex': 0,
        'endRowIndex': 11,
        'startColumnIndex': 0,
        'endColumnIndex': 1
      }
    }
  ],
  'spreadsheetUrl':
      'https://docs.google.com/spreadsheets/d/1ommsez3wSEbkj6_wLQM5o6gTmhZZApx5n4fgtPoV5TQ/edit'
};
