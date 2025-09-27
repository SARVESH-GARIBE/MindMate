document.addEventListener('DOMContentLoaded', () => {
    const bookingButtons = document.querySelectorAll('.card .btn-primary');
    const modal = document.getElementById('booking-modal');
    const modalTitle = document.getElementById('modal-title');
    const bookingForm = document.getElementById('booking-form');
    const cancelButton = bookingForm.querySelector('[data-close]');
    const rateSelect = document.getElementById('bk-rate');
    const priceInput = document.getElementById('bk-price');
    
    // Function to open the modal
    function openModal(expertName, expertId) {
        modalTitle.textContent = `Book Session with ${expertName}`;
        document.getElementById('bk-expert-id').value = expertId;
        modal.hidden = false;
        document.body.style.overflow = 'hidden'; // Prevents background scrolling
    }
    
    // Function to close the modal
    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = ''; // Restores background scrolling
        bookingForm.reset();
    }
    
    // Add click event listeners to all "Book Session" buttons
    bookingButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const card = event.target.closest('.card');
            const expertName = card.querySelector('.name').textContent;
            const expertId = event.target.dataset.expertId;
            openModal(expertName, expertId);
        });
    });
    
    // Add event listener to the cancel button
    cancelButton.addEventListener('click', closeModal);
    
    // Add event listener for clicking outside the modal
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Handle form submission
    bookingForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Stop the form from submitting normally
        
        const expertName = modalTitle.textContent.replace('Book Session with ', '');
        const name = document.getElementById('bk-name').value;
        const email = document.getElementById('bk-email').value;
        const dateTime = document.getElementById('bk-datetime').value;
        const rate = rateSelect.options[rateSelect.selectedIndex].text;
        
        alert(`Booking successful!
        Expert: ${expertName}
        Booked by: ${name}
        Email: ${email}
        Date & Time: ${new Date(dateTime).toLocaleString()}
        Session Rate: ${rate}`);
        
        closeModal();
    });

    // Update hidden price input when a rate is selected
    rateSelect.addEventListener('change', () => {
        const selectedOption = rateSelect.options[rateSelect.selectedIndex];
        priceInput.value = selectedOption.dataset.price;
    });

});