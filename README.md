Things to add:

- Add the favicon of each link [DONE]
- Add x next to each link to delete the link [DONE]
- Each session has a "delete" option to delete the session [DONE]
- Each session has a "restore" option to restore the links back to tabs [DONE]
- When a link is clicked, it is opened in a new tab and removed from the list. [DONE]
- When a link is clicked, the focus remains on the Taba tab. [DONE]
- Reduce amount of reloads
- Merging sessions
- If taba is active save all tabs and refresh the active page (IMPORTANT)
- Drag and drop from session to session [DONE]
- Drag and drop from tab to tab within session [DONE]


Things to fix:

- Pinned tabs are collected [FIXED]
- Taba tabs are collected [FIXED]
- New tabs are collected [FIXED]
- Pinned tabs prevent Taba from opening [FIXED]
- Some HTML is present in other sites after closing the holder [FIXED]
- Session names can have extra spaces [FIXED]
- Pressing tab focuses on session name inputs [FIXED]
- Loading tabs are collected
- When refreshing(programmatically) retain scroll value
- Slowness in restore all
- Fix bugs where the user starts with an empty storage


Things to improve code reading:

- Use getSelected instead of query({active: true, currentWindow: true})

Things to do for CSS:
- And have the same height as the amount of lines of the input
- Add a font
- Separate the buttons "Restore All", "Delete All", "Rename", etc.
- Adjust input width for .session-name to match the input