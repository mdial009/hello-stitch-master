# Hello Stitch

A beautiful, customizable bookmarks manager browser extension for Chrome and Firefox that replaces your default new tab page.

![Screenshot preview of the Hello, Stitch extension on a new tab](./PREVIEW.png)

## About This Project

Hello Stitch is a personal browser startup page and bookmarks manager that transforms your new tab experience into a stunning, organized dashboard. Built with JavaScript, HTML, and CSS, this extension integrates seamlessly with your browser's bookmark system to provide a rich, customizable interface for accessing your favorite sites.

### Version
1.0

### Supported Browsers
- Chrome
- Firefox

## Features

### 🎨 Themes (15+ Options)
- Default
- Matrix
- Ocean
- Sunset
- Forest
- Midnight
- Aurora
- Rose
- Lemon
- Coral
- Lavender
- Nord
- Dracula
- Monokai
- Cyberpunk

### 🔤 Fonts (10 Options)
- Buka Bird (custom font)
- Fredoka
- Poppins
- Roboto
- Open Sans
- Lato
- Montserrat
- Raleway
- Nunito
- Playfair

### 📏 Font Sizes
- 14px, 16px, 18px, 20px, 22px, 24px

### 💼 Work Mode
- Configure work hours (EST timezone)
- Set start and end times
- Select work days (Monday-Sunday)
- Automatically filters to show only work-related bookmarks during configured hours
- Define which folders are shown during work mode

### 📁 Folder Management
- Filter bookmarks by folder
- Pin favorites for quick access
- Show all bookmarks
- Collapse and expand folders to organize your view

### 🏷️ AI Auto-Tagging
Automatically categorizes bookmarks into 16 categories:
- Development & Tech
- Video & Streaming
- Social Media
- News & Media
- Shopping & E-commerce
- Productivity & Work
- Finance & Crypto
- Learning & Education
- Music & Audio
- Gaming
- Health & Fitness
- Food & Cooking
- Travel
- Design & Creative
- Email & Communication
- Cloud & Storage
- Security & Privacy

Additional auto-tags: login, settings, blog, download, forum

### 📊 Sorting Options
- Most Visited (frequency-based)
- Date Added
- A-Z (alphabetical)

### 📌 Pin Bookmarks
- Pin favorite bookmarks to keep them at the top
- Quick pin/unpin functionality

### ✏️ Edit & Delete
- Edit bookmark titles, URLs, and folders
- Delete unwanted bookmarks
- Move bookmarks between folders

### 📋 Multi-Select
- Select multiple bookmarks at once
- Open all selected bookmarks simultaneously
- Keyboard shortcut: Ctrl+A to select all

### 🔍 Search
- Quickly search through bookmarks by title
- Real-time filtering as you type

### 📥 Import/Export
- Export bookmarks to JSON for backup
- Import bookmarks from JSON file

### 📝 Custom Title
- Personalize your new tab with a custom title
- Displays current date and time
- Click directly on the title to edit it

### 🔗 Quick Links
- ChatGPT
- Grok
- Reddit
- Twitch
- YouTube (with search functionality)

### 🔄 Duplicate Detection
- Automatically detects and highlights duplicate bookmarks

## Installation

### Firefox
1. Go to `about:debugging` in address bar
2. Click _Load Temporary Add-on_ button on top right
3. Open any file at root directory of this extension's source
4. Note: In Firefox you'll have to manually set the home page

### Chrome
1. Go to `chrome://extensions/` in address bar
2. Tick _Developer mode_ toggle at top right
3. Click _Load Unpacked_
4. Choose the directory of this extension's source code

## Local Development

Clone the source:
```bash
git clone git@github.com:mdial009/hello-stitch.git
```

### Running Tests
A lightweight test script lives under `tests/utils.test.js`. It exercises several helpers and can be run with Node:
```bash
node tests/utils.test.js
```
It will print `utils tests passed` if everything is working correctly.

## Roadmap / Contributions

See https://github.com/mdial009/hello-stitch/issues

## Notes

- **Styles**: All CSS has been pulled out of the HTML file and now lives in `styles.css`. This keeps markup clean and makes layout tweaks simpler.
- **Manifest**: The `manifest.json` uses Manifest V2. For Chrome, this works as-is. For Firefox, you may need to remove the `applications` object from the manifest.

## License

See LICENSE file for details.

