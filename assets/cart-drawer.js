/**
 * Cart Drawer JS
 * Handles opening, closing, and updating the cart drawer
 * Enhanced for Glimfire luxury theme with better animations
 */

class CartDrawer {
  constructor() {
    // Cart drawer elements
    this.cartDrawer = document.querySelector('[data-cart-drawer]');
    this.cartOverlay = document.querySelector('[data-cart-overlay]');
    this.cartClose = document.querySelector('[data-cart-close]');
    this.cartItems = document.querySelector('[data-cart-items]');
    this.cartEmpty = document.querySelector('[data-cart-empty]');
    this.cartFooter = document.querySelector('[data-cart-footer]');
    this.subtotalElement = document.querySelector('[data-cart-subtotal]');
    
    // Cart toggle buttons 
    this.cartToggle = document.querySelectorAll('[data-cart-toggle]');
    
    // Initialize 
    this.bindEvents();
    this.animationSpeed = 400; // Animation duration in ms
  }

  bindEvents() {
    // Open cart when toggle is clicked
    if (this.cartToggle) {
      this.cartToggle.forEach(toggle => {
        toggle.addEventListener('click', this.openCart.bind(this));
      });
    }

    // Intercept regular cart links
    const cartLinks = document.querySelectorAll('a[href="/cart"]');
    cartLinks.forEach(link => {
      if (!link.classList.contains('cart-drawer__view-cart')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.openCart();
        });
      }
    });

    // Close cart when close button, overlay, or continue shopping is clicked
    if (this.cartClose) {
      this.cartClose.addEventListener('click', this.closeCart.bind(this));
    }
    
    if (this.cartOverlay) {
      this.cartOverlay.addEventListener('click', this.closeCart.bind(this));
    }
    
    // Add event delegation for cart item quantity and remove buttons
    if (this.cartItems) {
      this.cartItems.addEventListener('click', this.handleCartItemEvent.bind(this));
    }
    
    // Close cart on escape key press
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeCart();
      }
    });
    
    // Listen for custom cart update events
    document.addEventListener('cart:updated', this.updateCart.bind(this));
    
    // Listen for quick add events from product cards
    document.addEventListener('product:added', this.handleProductAdded.bind(this));
  }

  openCart(event) {
    if (event) event.preventDefault();
    
    // Add active class to show drawer
    this.cartDrawer.classList.add('active');
    this.cartOverlay.classList.add('active');
    
    // Prevent body scrolling
    document.body.classList.add('cart-drawer-open');
    
    // Focus on the drawer for accessibility
    this.cartDrawer.setAttribute('aria-hidden', 'false');
    this.cartDrawer.focus();
    
    // Apply luxury reveal animation 
    const items = this.cartDrawer.querySelectorAll('.cart-drawer__item');
    items.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
      
      setTimeout(() => {
        item.style.transition = `all ${this.animationSpeed}ms cubic-bezier(0.23, 1, 0.32, 1) ${index * 100}ms`;
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      }, 50);
    });
  }
  
  closeCart() {
    // Remove active class to hide drawer
    this.cartDrawer.classList.remove('active');
    this.cartOverlay.classList.remove('active');
    
    // Allow body scrolling
    document.body.classList.remove('cart-drawer-open');
    
    // Update accessibility attributes
    this.cartDrawer.setAttribute('aria-hidden', 'true');
  }

  handleCartItemEvent(event) {
    const target = event.target;
    
    // Handle quantity decrease
    if (target.closest('[data-quantity-minus]')) {
      const item = target.closest('[data-cart-item]');
      const key = item.getAttribute('data-line-item-key');
      const quantityElement = item.querySelector('[data-quantity-input]');
      let quantity = parseInt(quantityElement.textContent) - 1;
      
      if (quantity <= 0) {
        // Add animation before removal
        item.style.transition = `all ${this.animationSpeed}ms cubic-bezier(0.23, 1, 0.32, 1)`;
        item.style.opacity = '0';
        item.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
          this.updateItemQuantity(key, 0);
        }, this.animationSpeed);
      } else {
        // Update quantity
        quantityElement.textContent = quantity;
        this.updateItemQuantity(key, quantity);
      }
    }
    
    // Handle quantity increase
    if (target.closest('[data-quantity-plus]')) {
      const item = target.closest('[data-cart-item]');
      const key = item.getAttribute('data-line-item-key');
      const quantityElement = item.querySelector('[data-quantity-input]');
      let quantity = parseInt(quantityElement.textContent) + 1;
      
      // Add little bounce animation
      item.classList.add('cart-drawer__item--bounce');
      setTimeout(() => {
        item.classList.remove('cart-drawer__item--bounce');
      }, 500);
      
      quantityElement.textContent = quantity;
      this.updateItemQuantity(key, quantity);
    }
    
    // Handle item removal
    if (target.closest('[data-item-remove]')) {
      const item = target.closest('[data-cart-item]');
      const key = item.getAttribute('data-line-item-key');
      
      // Add animation before removal
      item.style.transition = `all ${this.animationSpeed}ms cubic-bezier(0.23, 1, 0.32, 1)`;
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
      
      setTimeout(() => {
        this.updateItemQuantity(key, 0);
      }, this.animationSpeed);
    }
  }

  updateItemQuantity(key, quantity) {
    // Show loading state
    this.cartDrawer.classList.add('loading');
    
    // Update cart using Shopify AJAX API
    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: key,
        quantity: quantity
      })
    })
    .then(response => response.json())
    .then(cart => {
      // Update cart state
      this.updateCart(cart);
    })
    .catch(error => {
      console.error('Error updating cart:', error);
    })
    .finally(() => {
      // Remove loading state
      this.cartDrawer.classList.remove('loading');
    });
  }

  handleProductAdded(event) {
    // Refresh cart and show drawer
    this.refreshCart(() => {
      this.openCart();
      // Highlight the newest item
      setTimeout(() => {
        const items = this.cartItems.querySelectorAll('.cart-drawer__item');
        const lastItem = items[items.length - 1];
        if (lastItem) {
          lastItem.classList.add('cart-drawer__item--new');
          setTimeout(() => {
            lastItem.classList.remove('cart-drawer__item--new');
          }, 2000);
        }
      }, 300);
    });
  }

  updateCart(cart) {
    // If cart is passed directly from an event, extract the cart data
    if (cart.detail && cart.detail.cart) {
      cart = cart.detail.cart;
    }
    
    // Update cart count (to be implemented by theme)
    document.dispatchEvent(new CustomEvent('cart:count', { 
      detail: { count: cart.item_count }
    }));
    
    // Show/hide empty cart message and footer
    if (cart.item_count === 0) {
      if (this.cartItems) this.cartItems.style.display = 'none';
      if (this.cartEmpty) this.cartEmpty.style.display = 'flex';
      if (this.cartFooter) this.cartFooter.style.display = 'none';
    } else {
      if (this.cartItems) this.cartItems.style.display = 'flex';
      if (this.cartEmpty) this.cartEmpty.style.display = 'none';
      if (this.cartFooter) this.cartFooter.style.display = 'block';
      
      // Update subtotal
      if (this.subtotalElement) {
        this.subtotalElement.innerHTML = this.formatMoney(cart.total_price);
      }
      
      // Update cart items
      this.refreshCart();
    }
  }

  refreshCart(callback) {
    // Fetch the cart drawer HTML and replace the current cart items
    fetch('/cart?view=drawer')
      .then(response => response.text())
      .then(html => {
        // Create a temporary div to hold the response
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Replace cart items
        const newCartItems = tempDiv.querySelector('[data-cart-items]');
        if (newCartItems && this.cartItems) {
          this.cartItems.innerHTML = newCartItems.innerHTML;
          
          // Update subtotal if it exists in the response
          const newSubtotal = tempDiv.querySelector('[data-cart-subtotal]');
          if (newSubtotal && this.subtotalElement) {
            this.subtotalElement.innerHTML = newSubtotal.innerHTML;
          }
        }
        
        if (callback && typeof callback === 'function') {
          callback();
        }
      })
      .catch(error => {
        console.error('Error refreshing cart:', error);
      });
  }

  formatMoney(cents) {
    // Format money with Intl.NumberFormat for better localization
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // This can be set based on shop currency
      minimumFractionDigits: 2
    });
    
    return formatter.format(cents / 100);
  }
}

// Initialize cart drawer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.cartDrawer = new CartDrawer();
});
