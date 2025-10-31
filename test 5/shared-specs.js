// STYLES
const style = document.createElement('style');
style.textContent = `
  #spec-list {
    position: fixed;
    right: 20px;
    top: 100px;
    width: 300px;
    min-width: 250px;
    min-height: 150px;
    background: white;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    z-index: 1000;
    max-height: 70vh;
    overflow-y: auto;
    resize: both;
    cursor: move;
    border-radius: 8px;
  }
  #spec-list:hover {
    box-shadow: 0 0 15px rgba(0,0,0,0.2);
  }
  .list-item {
    padding: 8px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .list-actions {
    display: flex;
    gap: 8px;
  }
  #list-controls {
    margin-top: 15px;
    display: flex;
    gap: 10px;
    justify-content: space-between;
  }
  .resize-handle {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 15px;
    height: 15px;
    cursor: nwse-resize;
    opacity: 0.5;
  }
`;
document.head.appendChild(style);

// LIST UI
const listHTML = `
<div id="spec-list">
  <div class="drag-handle" style="cursor: move; padding: 8px 0; user-select: none;">
    <h5>Specification List</h5>
  </div>
  <div id="list-content"></div>
  <div id="list-controls">
   <button class="btn btn-success btn-sm" onclick="specList.exportCSV()">Export CSV</button>
    <button class="btn btn-danger btn-sm" onclick="specList.clear()">Clear List</button>
  </div>
  <div class="resize-handle"></div>
</div>`;
document.body.insertAdjacentHTML('beforeend', listHTML);

// DRAG & RESIZE FUNCTIONALITY
let isDragging = false;
let isResizing = false;
let startX, startY, initialX, initialY, initialWidth, initialHeight;

const listElement = document.getElementById('spec-list');
const dragHandle = listElement.querySelector('.drag-handle');
const resizeHandle = listElement.querySelector('.resize-handle');

// Drag handlers
dragHandle.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialX = listElement.offsetLeft;
  initialY = listElement.offsetTop;
  e.preventDefault(); // Prevent text selection
});

// Resize handlers
resizeHandle.addEventListener('mousedown', (e) => {
  isResizing = true;
  startX = e.clientX;
  startY = e.clientY;
  initialWidth = listElement.offsetWidth;
  initialHeight = listElement.offsetHeight;
  e.preventDefault(); // Prevent text selection
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    listElement.style.left = `${initialX + dx}px`;
    listElement.style.top = `${initialY + dy}px`;
  }
  
  if (isResizing) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newWidth = Math.max(250, initialWidth + dx);
    const newHeight = Math.max(150, initialHeight + dy);
    listElement.style.width = `${newWidth}px`;
    listElement.style.height = `${newHeight}px`;
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  isResizing = false;
});

// SHARED FUNCTIONS
window.specList = {
  getList: () => JSON.parse(localStorage.getItem('specList')) || [],
  saveList: (list) => localStorage.setItem('specList', JSON.stringify(list)),

  add: function() {
    const output = document.getElementById('output');
    const fullDesc = document.getElementById('fullDescription');
    
    if (!output || !fullDesc) {
      console.error("Output elements not found");
      return;
    }
    
    // Get values from editable fields
    const outputValue = output.value.trim();
    const fullDescValue = fullDesc.value.trim();
    
    if (!outputValue) {
      alert('Please generate a valid specification first');
      return;
    }

    const list = this.getList();
    list.push({
      category: "Pipes and Pipe Fittings",
      name: outputValue,
      description: fullDescValue,
      timestamp: new Date().toISOString()
    });
    
    this.saveList(list);
    this.updateUI();
  },

  updateUI: function() {
    const listContent = document.getElementById('list-content');
    if (!listContent) return;
    
    listContent.innerHTML = this.getList().map((item, index) => `
      <div class="list-item">
        <div>
          <small>${item.category}</small><br>
          <strong>${item.name}</strong>
        </div>
        <div class="list-actions">
          <button class="btn btn-danger btn-sm" onclick="specList.remove(${index})">&times;</button>
        </div>
      </div>
    `).join('') || '<div class="text-muted text-center py-4">No specifications added yet</div>';
  },

  remove: function(index) {
    const list = this.getList();
    if (index >= 0 && index < list.length) {
      list.splice(index, 1);
      this.saveList(list);
      this.updateUI();
    }
  },

  clear: function() {
    if (confirm('Are you sure you want to clear the entire list?')) {
      localStorage.removeItem('specList');
      this.updateUI();
    }
  },

  exportCSV: function() {
    const list = this.getList();
    if (!list.length) return alert('List is empty');

    // Escape CSV special characters
    const escapeCSV = str => {
      if (!str) return '';
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      ['Category', 'Specification Name', 'Full Description', 'Timestamp'],
      ...list.map(item => [
        escapeCSV(item.category),
        escapeCSV(item.name),
        escapeCSV(item.description),
        new Date(item.timestamp).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `specifications_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Initialize on page load
function initSpecList() {
  // Find the main action container
  const actionContainers = Array.from(document.querySelectorAll('.mt-4')).filter(container => {
    return Array.from(container.children).some(child => 
      child.textContent.match(/Generate|Reset/)
    );
  });

  // Add button to first valid container
  if (actionContainers.length > 0) {
    const mainContainer = actionContainers[0];
    if (!mainContainer.querySelector('[onclick*="specList.add"]')) {
      mainContainer.insertAdjacentHTML('beforeend', `
        <button type="button" class="btn btn-info ml-2" onclick="specList.add()">
          Add to List
        </button>
      `);
    }
  }
  
  specList.updateUI();
}

// Wait for the page to fully load
if (document.readyState === 'complete') {
  initSpecList();
} else {
  document.addEventListener('DOMContentLoaded', initSpecList);
}