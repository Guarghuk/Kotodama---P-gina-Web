class Forum {
  constructor() {
    this.posts = JSON.parse(localStorage.getItem('kt_posts') || '[]');
    this.favorites = JSON.parse(localStorage.getItem('kt_fav') || '[]');
  }

  save() {
    localStorage.setItem('kt_posts', JSON.stringify(this.posts));
    localStorage.setItem('kt_fav', JSON.stringify(this.favorites));
  }

  createPost(title, content) {
    const post = {
      id: Date.now(),
      title,
      content,
      comments: [],
      likes: 0,
      createdAt: new Date().toISOString()
    };
    this.posts.unshift(post);
    this.save();
    return post;
  }

  addComment(postId, text) {
    const p = this.posts.find(x => x.id === postId);
    if (!p) return null;
    p.comments.push({ id: Date.now(), text, createdAt: new Date().toISOString() });
    this.save();
    return p;
  }

  toggleLike(postId) {
    const p = this.posts.find(x => x.id === postId);
    if (!p) return null;
    p.likes = (p.likes || 0) + 1;
    this.save();
    return p;
  }

  toggleFavorite(postId) {
    const idx = this.favorites.indexOf(postId);
    if (idx === -1) this.favorites.push(postId);
    else this.favorites.splice(idx, 1);
    this.save();
  }

  search(q) {
    const Q = (q || '').trim().toLowerCase();
    if (!Q) return this.posts;
    return this.posts.filter(p => p.title.toLowerCase().includes(Q) || p.content.toLowerCase().includes(Q));
  }
}

/* --- DOM interactions --- */
const forum = new Forum();

function renderPosts(list = forum.posts) {
  const container = document.getElementById('postsList');
  if (!container) return;
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<p>No hay publicaciones aún. Sé el primero en publicar.</p>';
    return;
  }
  list.forEach(post => {
    const el = document.createElement('article');
    el.className = 'post-card';
    el.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <div class="post-meta">Publicado: ${new Date(post.createdAt).toLocaleString()}</div>
      <p>${escapeHtml(post.content)}</p>
      <div class="post-actions">
        <button data-action="comments" data-id="${post.id}">Comentarios (${post.comments.length})</button>
        <button data-action="like" data-id="${post.id}">👍 ${post.likes || 0}</button>
        <button data-action="fav" data-id="${post.id}">${forum.favorites.includes(post.id) ? '💾 Guardado' : '💾 Guardar'}</button>
      </div>
    `;
    container.appendChild(el);
  });
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]);
}

/* Event wiring */
document.addEventListener('DOMContentLoaded', () => {
  renderPosts();

  // New post modal
  const newPostBtn = document.getElementById('newPostBtn');
  const newPostModal = document.getElementById('newPostModal');
  const closeNew = document.getElementById('closeNewPost');
  const newForm = document.getElementById('newPostForm');

  if (newPostBtn) newPostBtn.addEventListener('click', () => newPostModal.classList.remove('hidden'));
  if (closeNew) closeNew.addEventListener('click', () => newPostModal.classList.add('hidden'));
  if (newForm) {
    newForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = document.getElementById('postTitle').value.trim();
      const c = document.getElementById('postContent').value.trim();
      if (t && c) {
        forum.createPost(t, c);
        newForm.reset();
        newPostModal.classList.add('hidden');
        renderPosts();
      }
    });
  }

  // Posts actions (event delegation)
  const postsList = document.getElementById('postsList');
  if (postsList) {
    postsList.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      if (action === 'comments') openComments(id);
      if (action === 'like') { forum.toggleLike(id); renderPosts(); }
      if (action === 'fav') { forum.toggleFavorite(id); renderPosts(); }
    });
  }

  // Search
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  if (searchBtn) searchBtn.addEventListener('click', () => {
    const res = forum.search(searchInput.value || '');
    renderPosts(res);
  });

  // Comments modal
  const commentsModal = document.getElementById('commentsModal');
  const closeComments = document.getElementById('closeComments');
  const commentsList = document.getElementById('commentsList');
  const postDetail = document.getElementById('postDetail');
  const commentForm = document.getElementById('commentForm');

  if (closeComments) closeComments.addEventListener('click', () => commentsModal.classList.add('hidden'));

  function openComments(postId) {
    const post = forum.posts.find(p => p.id === postId);
    if (!post) return;
    postDetail.innerHTML = `<h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.content)}</p>`;
    commentsList.innerHTML = post.comments.map(c => `<div class="comment">${escapeHtml(c.text)}<div class="post-meta">${new Date(c.createdAt).toLocaleString()}</div></div>`).join('') || '<p>Sin comentarios</p>';
    commentForm.onsubmit = (ev) => {
      ev.preventDefault();
      const txt = document.getElementById('commentText').value.trim();
      if (txt) {
        forum.addComment(postId, txt);
        document.getElementById('commentText').value = '';
        openComments(postId); // rerender
        renderPosts();
      }
    };
    commentsModal.classList.remove('hidden');
  }
});