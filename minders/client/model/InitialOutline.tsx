// @ flow

export const INITIAL_OUTLINE = {
  top: {
    sub: [
      {
        state: 'top',
        text: 'Your first project!',
        id: 1,
        ui: {
          hidden: false,
          closed: false,
        },
        sub: [
          {
            state: 'top',
            text: 'Your first todo (yay!)',
            id: 2,
            ui: {
              hidden: false,
              closed: false,
            },
          },
        ],
      },
      {
        state: 'top',
        text: 'Learn how to use Outliner',
        id: 3,
        ui: {
          hidden: false,
          closed: false,
        },
        sub: [
          {
            state: 'top',
            text: 'Click on target icon to focus a project',
            id: 4,
            ui: {
              hidden: false,
              closed: false,
            },
          },
          {
            state: 'top',
            text: 'Click on plus icon to add a minder',
            id: 5,
            ui: {
              hidden: false,
              closed: false,
            },
          },
          {
            state: 'top',
            text: 'Click on "Outline" in menu to switch views',
            id: 56,
            ui: {
              hidden: false,
              closed: false,
            },
          },
          {
            state: 'top',
            text: 'Click on star icon to change status and mark items done',
            id: 7,
            ui: {
              hidden: false,
              closed: false,
            },
          },
          {
            state: 'top',
            text: 'Click on menu dots and Snooze an item',
            id: 8,
            ui: {
              hidden: false,
              closed: false,
            },
          },
          {
            state: 'top',
            text: 'Type return on a line to go to next line',
            id: 9,
            ui: {
              hidden: false,
              closed: false,
            },
          },
          {
            state: 'top',
            text: 'Type tab on a line in "Outline" view to organize',
            id: 10,
            ui: {
              hidden: false,
              closed: false,
            },
            sub: [
              {
                state: 'top',
                text: 'Test child item two',
                id: 12,
                ui: {
                  hidden: false,
                  closed: false,
                },
              },
              {
                state: 'top',
                text: 'Test child item',
                id: 11,
                ui: {
                  hidden: false,
                  closed: false,
                },
              },
            ],
          },
        ],
      },
    ],
    ui: {
      hidden: false,
      visibilityFilter: 'focus',
      view: 'outline',
    },
    state: 'top',
    text: 'Projects',
    id: 11,
  },
  version: 1,
  baseVersion: 1,
};
