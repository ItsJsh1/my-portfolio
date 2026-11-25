# Portfolio Template

Plain HTML, CSS and JavaScript. No build step needed.

## Files
- index.html             all content (search for "Your Name" and replace)
- css/style.css          colors are at the top under :root
- js/main.js             dot settings (GAP, RADIUS, PUSH...) at the top, plus scroll animation and icon code
- assets/images/         profile.jpg, profile-2.jpg, profile-3.jpg, project-1.jpg, project-2.jpg, project-3.jpg, education-1.jpg, education-2.jpg, cert-1.jpg to cert-6.jpg (one per certificate)
- assets/files/          resume.pdf

## Deploy to Vercel
1. Unzip, then push the folder to GitHub, or run `vercel` inside the folder.
2. Import the repo in Vercel. Framework preset: "Other". Leave build command and output directory empty.
3. Deploy.

## Tech stack icons
Each stack icon loads online (Devicon / Simple Icons CDN). If one fails, the site tries a backup link, then shows a generic icon.
Skills and contact icons are built into index.html (the hidden sprite at the top of <body>), so they never need internet.

## Chatbot (Joshyyy), progress bar, dark mode, music, scroll buttons
- Joshyyy answers using the text that is already on the page (experience, tech stack, education, certifications, contact). Edit index.html and the bot knows the new details. Template placeholder text and placeholder links are never repeated by the bot.
- Dark / light mode: the button in the header. The choice is remembered.
- Music: assets/audio/chill.mp3 is used if you add that file, otherwise an online lo-fi track plays. Browsers block sound until the visitor clicks or taps, so it starts on the first click. The header button turns it off (and remembers).
- Bottom left: "Auto scroll" glides down the page (any scroll, tap or key stops it) and "Back to top".

## Floating buttons
- Bottom left (top to bottom): Music, Dark/Light mode, Back to top (shows after scrolling), Auto scroll.
- Bottom right: Accessibility, Read aloud, Chatbot. When the chatbot or the accessibility window opens, the other two buttons slide to the left of the chat button. Only one window is open at a time.
- Accessibility window: text size, readable font, wider spacing, high contrast, highlight links, pause animations (saved on the visitor's device). Read aloud uses the visitor's browser voice and reads from the section on screen.

## Where to add your own links and photos
- Employment requirements (id="requirements" in index.html): paste each Google Drive link into the `href="#"` of the tile (the first link in each `<li class="req">`). Set the Drive file to "Anyone with the link can view". The page counts the ready documents, and builds the download button for file links automatically.
- Certifications: each card has a "Link" button. Replace its `href="#"` with your credential URL.
- Education photos (landscape): assets/images/education-1.jpg, education-2.jpg, education-3.jpg.
- Floating ID in the hero uses assets/images/profile.jpg. Its text ("Unemployed", "Hire me now") is in index.html inside `<div class="id-scene">`.
- Hobbies: edit the "Hobbies" group in the Tech stacks card.
