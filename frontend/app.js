const memberList = document.getElementById('member-list');
const memberForm = document.getElementById('member-form');
const statusBox = document.getElementById('status');

async function loadMembers() {
  if (!memberList) return;

  try {
    const response = await fetch('/api/members');
    const members = await response.json();
    memberList.innerHTML = '';

    if (!members.length) {
      memberList.innerHTML = '<li>No members yet.</li>';
      return;
    }

    members.forEach((member) => {
      const item = document.createElement('li');
      item.innerHTML = `<strong>${member.name}</strong> — ${member.email} <span>(${member.plan})</span>`;
      memberList.appendChild(item);
    });
  } catch (error) {
    memberList.innerHTML = '<li>Unable to load members.</li>';
  }
}

if (memberForm) {
  memberForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(memberForm);

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      plan: formData.get('plan')
    };

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok) {
        statusBox.textContent = `Added ${result.name}`;
        memberForm.reset();
        loadMembers();
      } else {
        statusBox.textContent = result.error || 'Could not save member';
      }
    } catch (error) {
      statusBox.textContent = 'Server connection failed';
    }
  });
}

document.addEventListener('DOMContentLoaded', loadMembers);
