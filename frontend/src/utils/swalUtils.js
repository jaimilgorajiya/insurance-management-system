import Swal from 'sweetalert2';

const colors = {
    primary: '#2563eb',
    secondary: '#64748b',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    text: '#0f172a'
};

const baseConfig = {
    confirmButtonColor: colors.primary,
    cancelButtonColor: colors.secondary,
    color: colors.text,
    background: '#ffffff',
    customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        confirmButton: 'swal-custom-confirm',
        cancelButton: 'swal-custom-cancel'
    }
};

export const showSuccessAlert = (message, title = 'Success') => {
    return Swal.fire({
        ...baseConfig,
        icon: 'success',
        title: title,
        text: message,
        confirmButtonColor: colors.success,
        timer: 1500,
        showConfirmButton: false
    });
};

export const showErrorAlert = (message, title = 'Error') => {
    return Swal.fire({
        ...baseConfig,
        icon: 'error',
        title: title,
        text: message,
        confirmButtonColor: colors.danger
    });
};

export const showWarningAlert = (message, title = 'Warning') => {
    return Swal.fire({
        ...baseConfig,
        icon: 'warning',
        title: title,
        text: message,
        confirmButtonColor: colors.warning
    });
};

export const showConfirmDelete = async (itemName = 'item') => {
    return Swal.fire({
        ...baseConfig,
        title: 'Are you sure?',
        text: `You are about to delete this ${itemName}. This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: colors.danger,
        cancelButtonColor: colors.secondary,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        reverseButtons: true
    }).then((result) => result.isConfirmed);
};

export const showConfirmAction = async (title, message, confirmText = 'Yes, proceed', actionColor = colors.primary) => {
    return Swal.fire({
        ...baseConfig,
        title: title,
        text: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: actionColor,
        cancelButtonColor: colors.secondary,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancel'
    }).then((result) => result.isConfirmed);
};
