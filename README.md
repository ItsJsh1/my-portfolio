# Joshua Vidal | Portfolio

Personal portfolio website of **Joshua Vidal**, an Information Technology graduate (Cum Laude) and aspiring Software Engineer / Application Support professional based in Taguig City, Philippines.

**Live site:** `https://your-site.vercel.app` *(replace with your Vercel URL)*

---

## About

This site presents my experience, projects, education, certifications, and employment requirements in one fast, single-page layout. It is built with plain HTML, CSS, and JavaScript, so there is no build step and nothing to install.

## Features

- **Single-page layout** with sections for About, Tech Stack, Experience, Projects, Education, Certifications, Requirements, and Contact
- **Interactive hero** with a draggable ID card on a lanyard and an animated dot background
- **Dark / light mode**, with the choice remembered on the visitor's device
- **Chatbot (Joshyyy)** that answers questions using the content already on the page
- **Accessibility panel** with text size, readable font, wider spacing, high contrast, link highlighting, and paused animations
- **Read aloud** using the visitor's browser voice
- **Photo galleries** for profile and education photos, with keyboard navigation
- **Certificate previews** with download and credential links
- **Employment requirements checklist** showing the documents I have ready, with copies sent upon request
- **Background music toggle** and **Auto scroll / Back to top** controls
- **Responsive design** for mobile, tablet, and desktop

## Tech Stack

| Area | Tools |
| --- | --- |
| Front end | HTML5, CSS3, JavaScript (vanilla) |
| Hosting | Vercel |
| Version control | Git, GitHub |
| Icons | Devicon and Simple Icons (CDN), plus a built-in SVG sprite |

## Project Structure

```
.
├── index.html          # All page content
├── css/
│   └── style.css       # Styles and theme colors (see :root)
├── js/
│   └── main.js         # Animations, chatbot, accessibility, and UI logic
├── assets/
│   ├── images/         # Profile, project, education, and certificate photos
│   ├── files/          # resume.pdf
│   └── audio/          # Optional chill.mp3 for background music
├── vercel.json         # Vercel configuration (clean URLs and caching)
└── README.md
```

## Featured Projects

| Project | Stack | Links |
| --- | --- | --- |
| **DTI Equipment Inventory Management System (DTI-EIMS)** | PHP, Laravel, MySQL, Tailwind CSS, JavaScript, Gemini Chatbot, RESTful APIs | [Source code](https://github.com/ItsJsh1/Equipment-Inventory-Management-System) |
| **RECInc. Membership Information Management System (REC-MIMS)** | PHP, Laravel, MySQL, Tailwind CSS, JavaScript, Botpress AI, RESTful APIs | [Live site](https://beta.rec.org.ph/) · [Source code](https://github.com/JanLeoEgamen/REC_MIMS) |
| **Faculty Data Management Evaluation Research Repository (PUP-FESR)** | Selenium, MySQL Workbench | [Source code](https://github.com/PUPT-HRIS/PUPTHRIS) |

## Experience Highlights

- **IT Support and Helpdesk Associate Intern**, Department of Trade and Industry, Makati City (2026)
- **Web Developer**, Radio Engineering Circle Inc., Taguig City (2025 to 2026)
- **Data Entry / Encoder (Freelance)**, US Title Network and Georgetown County (2024 to 2026)

## Education and Certifications

- **BS Information Technology**, Polytechnic University of the Philippines, Taguig Campus (Cum Laude, President's Lister, L.A.N.I Scholar)
- **Google IT Support Professional Certificate**, Coursera (2026)
- **Amazon Junior Software Developer Professional Certificate**, Coursera (2026)

## Run Locally

No dependencies are required.

```bash
# 1. Clone the repository
git clone https://github.com/ItsJsh1/your-repo-name.git

# 2. Move into the folder
cd your-repo-name

# 3. Open index.html in your browser
open index.html          # macOS
# start index.html       # Windows
```

Optionally, serve it locally with any static server:

```bash
npx serve .
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com), click **Add New → Project**, and import the repository.
3. Set **Framework Preset** to `Other` and leave the build command and output directory empty.
4. Click **Deploy**.

Every push to the `main` branch redeploys the site automatically.

## Customization

- **Content:** edit `index.html`. The chatbot reads the page text, so it updates automatically.
- **Colors and theme:** change the variables under `:root` in `css/style.css`.
- **Photos:** replace files in `assets/images/` (keep the same file names).
- **Resume:** replace `assets/files/resume.pdf`.
- **Background music:** add `assets/audio/chill.mp3`. Without it, an online lo-fi track plays.
- **Requirement status:** to mark a document as not yet available, add the `pending` class to its `<li class="req">` in the Requirements section.

## Contact

- **Email:** [vidal.joshuaflorante@gmail.com](mailto:vidal.joshuaflorante@gmail.com)
- **GitHub:** [github.com/ItsJsh1](https://github.com/ItsJsh1)
- **Location:** Taguig City, Metro Manila, Philippines

I am open to opportunities in Application Support, IT Operations, and Software Development.

---

&copy; 2026 Joshua Vidal. All rights reserved.
