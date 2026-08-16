/**
 * Smart Kids - Dynamic Photo Gallery & Client-Side Image Upload Engine
 * High-Contrast Bold Typography & Mobile-Optimized Lightbox
 */

class GalleryEngine {
  constructor() {
    this.currentFilter = 'all';
    this.currentLightboxIndex = 0;
    this.activeGalleryItems = [];
    this.initEvents();
  }

  initEvents() {
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('lightbox-modal');
      if (modal && modal.classList.contains('active')) {
        if (e.key === 'Escape') this.closeLightbox();
        if (e.key === 'ArrowRight') this.nextLightboxImage();
        if (e.key === 'ArrowLeft') this.prevLightboxImage();
      }
    });
  }

  renderGalleryGrid(containerId = 'gallery-grid-container', filterCategory = 'all') {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.currentFilter = filterCategory;
    const allItems = window.schoolStore.getGallery();
    
    this.activeGalleryItems = filterCategory === 'all' 
      ? allItems 
      : allItems.filter(item => item.category.toLowerCase() === filterCategory.toLowerCase());

    if (this.activeGalleryItems.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 4rem 1rem;">
          <i class="fas fa-images" style="font-size:3rem; color:#CBD5E1; margin-bottom:1rem;"></i>
          <h4 style="color:#000000; font-weight:800;">No photos found in this category</h4>
          <p style="color:#000000; font-size:0.95rem; font-weight:700;">Upload new event photos using the upload button above.</p>
        </div>
      `;
      return;
    }

    const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'admin';

    container.innerHTML = this.activeGalleryItems.map((item, index) => `
      <div class="gallery-card" style="background:white; border-radius:16px; overflow:hidden; border:1.5px solid #CBD5E1; box-shadow:0 4px 6px -1px rgba(0,0,0,0.06); transition:transform 0.25s ease, box-shadow 0.25s ease;">
        <div style="position:relative; aspect-ratio:4/3; overflow:hidden; cursor:pointer;" onclick="window.galleryEngine.openLightbox(${index})">
          <img src="${item.imageUrl}" alt="${item.title}" loading="lazy" style="width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease;" />
          <span class="badge badge-yellow" style="position:absolute; top:12px; left:12px; font-weight:800; color:#000000; box-shadow:0 2px 6px rgba(0,0,0,0.25);">
            ${item.category}
          </span>
          ${isAdmin ? `
            <button class="btn btn-coral btn-sm" style="position:absolute; top:12px; right:12px; padding:4px 8px; font-size:0.8rem;" onclick="event.stopPropagation(); window.galleryEngine.deletePhoto('${item.id}')" title="Delete Photo">
              <i class="fas fa-trash"></i>
            </button>
          ` : ''}
        </div>
        <div style="padding:1.25rem;">
          <div style="font-size:0.82rem; color:#000000; font-weight:800; margin-bottom:4px; display:flex; align-items:center; gap:5px;">
            <i class="far fa-calendar-alt text-primary"></i> ${item.date || 'Recent Event'}
          </div>
          <h4 style="font-size:1.15rem; font-weight:800; color:#1E3A8A; margin-bottom:6px; cursor:pointer;" onclick="window.galleryEngine.openLightbox(${index})">
            ${item.title}
          </h4>
          <p style="font-size:0.92rem; color:#000000; font-weight:700; line-height:1.5;">
            ${item.description || 'Preschool special moments and memories.'}
          </p>
        </div>
      </div>
    `).join('');
  }

  filterGallery(category, buttonElement) {
    const filterButtons = document.querySelectorAll('.gallery-filter-btn');
    filterButtons.forEach(btn => btn.className = 'btn btn-outline btn-sm gallery-filter-btn');
    if (buttonElement) buttonElement.className = 'btn btn-primary btn-sm gallery-filter-btn';

    this.renderGalleryGrid('gallery-grid-container', category);
  }

  openLightbox(index) {
    if (!this.activeGalleryItems[index]) return;
    this.currentLightboxIndex = index;
    const item = this.activeGalleryItems[index];

    let lightbox = document.getElementById('lightbox-modal');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'lightbox-modal';
      lightbox.className = 'modal-overlay';
      lightbox.style.backgroundColor = 'rgba(0, 0, 0, 0.94)';
      document.body.appendChild(lightbox);
    }

    lightbox.innerHTML = `
      <div style="position:relative; width:95%; max-width:900px; margin:auto; text-align:center;">
        <!-- Close Button -->
        <button onclick="window.galleryEngine.closeLightbox()" style="position:absolute; top:-45px; right:0; background:rgba(255,255,255,0.25); border:none; color:white; font-size:1.8rem; width:44px; height:44px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:20;">
          &times;
        </button>

        <!-- Navigation Buttons -->
        <button onclick="window.galleryEngine.prevLightboxImage()" style="position:absolute; left:-15px; top:50%; transform:translateY(-50%); background:rgba(255,255,255,0.3); border:none; color:white; font-size:1.4rem; width:46px; height:46px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10;">
          <i class="fas fa-chevron-left"></i>
        </button>

        <!-- Main Lightbox Image -->
        <div style="border-radius:16px; overflow:hidden; background:#000; box-shadow:0 25px 50px -12px rgba(0,0,0,0.6); max-height:70vh; display:flex; align-items:center; justify-content:center;">
          <img src="${item.imageUrl}" alt="${item.title}" style="max-width:100%; max-height:70vh; object-fit:contain;" />
        </div>

        <button onclick="window.galleryEngine.nextLightboxImage()" style="position:absolute; right:-15px; top:50%; transform:translateY(-50%); background:rgba(255,255,255,0.3); border:none; color:white; font-size:1.4rem; width:46px; height:46px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10;">
          <i class="fas fa-chevron-right"></i>
        </button>

        <!-- Caption Metadata -->
        <div style="background:rgba(255,255,255,0.98); padding:1rem 1.5rem; border-radius:12px; margin-top:1rem; text-align:left; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <span class="badge badge-yellow" style="margin-bottom:4px; font-weight:800; color:#000000;">${item.category}</span>
            <h3 style="font-size:1.3rem; color:#1E3A8A; margin:0; font-weight:800;">${item.title}</h3>
            <p style="color:#000000; font-size:0.92rem; font-weight:700; margin-top:2px;">${item.description || ''}</p>
          </div>
          <div style="font-size:0.85rem; color:#000000; font-weight:800; text-align:right;">
            Photo ${index + 1} of ${this.activeGalleryItems.length}<br>
            <span style="color:#1E3A8A;">${item.date}</span>
          </div>
        </div>
      </div>
    `;

    lightbox.classList.add('active');
  }

  nextLightboxImage() {
    const nextIndex = (this.currentLightboxIndex + 1) % this.activeGalleryItems.length;
    this.openLightbox(nextIndex);
  }

  prevLightboxImage() {
    const prevIndex = (this.currentLightboxIndex - 1 + this.activeGalleryItems.length) % this.activeGalleryItems.length;
    this.openLightbox(prevIndex);
  }

  closeLightbox() {
    const lightbox = document.getElementById('lightbox-modal');
    if (lightbox) lightbox.classList.remove('active');
  }

  openUploadModal() {
    let modal = document.getElementById('gallery-upload-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'gallery-upload-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width:540px;">
        <div class="modal-header" style="background:#1E3A8A; color:white;">
          <h3 class="modal-title" style="color:white; font-size:1.25rem;">
            <i class="fas fa-cloud-upload-alt text-warning"></i> Upload Photos to Gallery
          </h3>
          <button class="modal-close" onclick="window.galleryEngine.closeUploadModal()" style="background:rgba(255,255,255,0.2); color:white;">&times;</button>
        </div>

        <div class="modal-body" style="padding:1.5rem;">
          <form id="gallery-upload-form" onsubmit="window.galleryEngine.handleUploadSubmit(event)">
            <div class="upload-dropzone" id="gallery-dropzone" onclick="document.getElementById('gallery-file-input').click()">
              <i class="fas fa-camera-retro"></i>
              <h4 style="font-size:1.1rem; color:#1E3A8A; font-weight:800; margin-bottom:4px;">Drag & Drop or Click to Browse</h4>
              <p style="font-size:0.85rem; color:#000000; font-weight:700;">Supported: JPG, PNG, WebP (Auto-optimized)</p>
              <input type="file" id="gallery-file-input" accept="image/*" style="display:none;" onchange="window.galleryEngine.handleFileSelected(event)" />
            </div>

            <div id="image-upload-preview" style="display:none; margin:1rem 0; text-align:center;">
              <img id="preview-img-tag" src="" alt="Preview" style="max-height:160px; border-radius:10px; margin:auto; border:2px solid #CBD5E1;" />
              <div style="font-size:0.8rem; color:#059669; margin-top:4px; font-weight:800;">
                <i class="fas fa-check-circle"></i> Image Optimized & Ready
              </div>
            </div>

            <div class="form-group" style="margin-top:1rem;">
              <label class="form-label">Photo Title / Event Name *</label>
              <input type="text" id="upload-photo-title" class="form-control" placeholder="e.g. Science Fair Project Presentation" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category *</label>
                <select id="upload-photo-category" class="form-control" required>
                  <option value="Annual Day">Annual Day</option>
                  <option value="Sports Meet">Sports Meet</option>
                  <option value="Art & Craft">Art & Craft</option>
                  <option value="Field Trips">Field Trips</option>
                  <option value="Classroom Fun" selected>Classroom Fun</option>
                  <option value="Festivals">Festivals</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Date of Event</label>
                <input type="date" id="upload-photo-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Description / Caption</label>
              <textarea id="upload-photo-desc" class="form-control" rows="2" placeholder="Brief description of the activity or moment..."></textarea>
            </div>

            <button type="submit" class="btn btn-green btn-block">
              <i class="fas fa-upload"></i> Save & Publish Photo
            </button>
          </form>
        </div>
      </div>
    `;

    const dropzone = document.getElementById('gallery-dropzone');
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.compressAndPreviewImage(e.dataTransfer.files[0]);
        }
      });
    }

    modal.classList.add('active');
  }

  closeUploadModal() {
    const modal = document.getElementById('gallery-upload-modal');
    if (modal) modal.classList.remove('active');
  }

  handleFileSelected(event) {
    if (event.target.files && event.target.files[0]) {
      this.compressAndPreviewImage(event.target.files[0]);
    }
  }

  compressAndPreviewImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        this.selectedImageDataUrl = compressedDataUrl;

        const previewBox = document.getElementById('image-upload-preview');
        const previewImg = document.getElementById('preview-img-tag');
        if (previewBox && previewImg) {
          previewImg.src = compressedDataUrl;
          previewBox.style.display = 'block';
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  handleUploadSubmit(event) {
    event.preventDefault();
    if (!this.selectedImageDataUrl) {
      showToast('Please select or drop an image first.', 'warning');
      return;
    }

    const title = document.getElementById('upload-photo-title').value.trim();
    const category = document.getElementById('upload-photo-category').value;
    const date = document.getElementById('upload-photo-date').value;
    const desc = document.getElementById('upload-photo-desc').value.trim();

    const newItem = {
      id: `gal-${Date.now()}`,
      title: title,
      category: category,
      date: date,
      imageUrl: this.selectedImageDataUrl,
      description: desc
    };

    window.schoolStore.addGalleryItem(newItem);
    this.closeUploadModal();
    this.selectedImageDataUrl = null;

    showToast('Photo uploaded and published to gallery!', 'success');
    this.renderGalleryGrid('gallery-grid-container', this.currentFilter);
  }

  deletePhoto(id) {
    if (confirm('Are you sure you want to remove this photo from the gallery?')) {
      window.schoolStore.deleteGalleryItem(id);
      showToast('Photo removed from gallery.', 'info');
      this.renderGalleryGrid('gallery-grid-container', this.currentFilter);
    }
  }
}

window.galleryEngine = new GalleryEngine();
