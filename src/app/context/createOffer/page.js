'use client';
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Upload,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Box,
  Tag,
  Loader,
  RefreshCw
} from 'lucide-react';

const VariantOfferManager = () => {
  const [activeTab, setActiveTab] = useState('variants');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  
  // Data states
  const [variants, setVariants] = useState([]);
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]); // For parent product selection
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  
  // Form states
  const [newVariant, setNewVariant] = useState({
    parentId: '',
    name: '',
    sku: '',
    upc: '',
    ean: '',
    mpn: '',
    model: '',
    variantAttributes: {},
    description: '',
    weight: '',
    dimensions: { length: '', width: '', height: '', unit: 'cm' },
    attributes: {}
  });

  const [newOffer, setNewOffer] = useState({
    variantId: '',
    price: '',
    stock: '',
    condition: 'new',
    sellerSku: '',
    shippingInfo: {
      freeShipping: false,
      shippingCost: '',
      estimatedDelivery: '2-3 business days'
    }
  });

  const API_URL = 'http://localhost:3092';

  // API Helper Functions
  const apiRequest = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  };

  // Data fetching functions
  const fetchVariants = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });
      
      const data = await apiRequest(`/admin/variants?${params}`);
      setVariants(data.variants || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      setError('Failed to load variants: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });
      
      const data = await apiRequest(`/admin/offers?${params}`);
      setOffers(data.offers || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      setError('Failed to load offers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiRequest('/admin/products?limit=100');
      setProducts(data.products || []);
    } catch (err) {
      setError('Failed to load products: ' + err.message);
    }
  };

  // Action functions
  const createVariant = async (variantData) => {
    try {
      setLoading(true);
      await apiRequest(`/admin/products/${variantData.parentId}/variants`, {
        method: 'POST',
        body: JSON.stringify(variantData),
      });
      
      setSuccess('Variant created successfully!');
      fetchVariants();
      setShowCreateModal(false);
      resetVariantForm();
    } catch (err) {
      setError('Failed to create variant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createOffer = async (offerData) => {
    try {
      setLoading(true);
      await apiRequest(`/variants/${offerData.variantId}/offers`, {
        method: 'POST',
        body: JSON.stringify(offerData),
      });
      
      setSuccess('Offer created successfully!');
      fetchOffers();
      setShowCreateOfferModal(false);
      resetOfferForm();
    } catch (err) {
      setError('Failed to create offer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleVariantStatus = async (variantId) => {
    try {
      await apiRequest(`/admin/variants/${variantId}/toggle-status`, {
        method: 'PATCH',
      });
      fetchVariants();
    } catch (err) {
      setError('Failed to toggle variant status: ' + err.message);
    }
  };

  const toggleOfferStatus = async (offerId) => {
    try {
      await apiRequest(`/admin/offers/${offerId}/toggle-status`, {
        method: 'PATCH',
      });
      fetchOffers();
    } catch (err) {
      setError('Failed to toggle offer status: ' + err.message);
    }
  };

  const deleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      await apiRequest(`/admin/offers/${offerId}`, {
        method: 'DELETE',
      });
      setSuccess('Offer deleted successfully!');
      fetchOffers();
    } catch (err) {
      setError('Failed to delete offer: ' + err.message);
    }
  };

  // Form reset functions
  const resetVariantForm = () => {
    setNewVariant({
      parentId: '',
      name: '',
      sku: '',
      upc: '',
      ean: '',
      mpn: '',
      model: '',
      variantAttributes: {},
      description: '',
      weight: '',
      dimensions: { length: '', width: '', height: '', unit: 'cm' },
      attributes: {}
    });
  };

  const resetOfferForm = () => {
    setNewOffer({
      variantId: '',
      price: '',
      stock: '',
      condition: 'new',
      sellerSku: '',
      shippingInfo: {
        freeShipping: false,
        shippingCost: '',
        estimatedDelivery: '2-3 business days'
      }
    });
  };

  // Auto-dismiss alerts
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Initial data loading
  useEffect(() => {
    fetchProducts();
  }, []);

  // Tab-specific data loading
  useEffect(() => {
    if (activeTab === 'variants') {
      fetchVariants();
    } else if (activeTab === 'offers') {
      fetchOffers();
    }
  }, [activeTab]);

  // Search functionality
  useEffect(() => {
    const debounceSearch = setTimeout(() => {
      if (activeTab === 'variants') {
        fetchVariants(1, searchTerm);
      } else if (activeTab === 'offers') {
        fetchOffers(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(debounceSearch);
  }, [searchTerm, activeTab]);

  // Alert components
  const AlertMessage = ({ type, message, onClose }) => (
    <div className={`rounded-lg p-4 mb-6 ${
      type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          )}
          <span className={type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message}
          </span>
        </div>
        <button 
          onClick={onClose}
          className={type === 'error' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Create Variant Modal
  const CreateVariantModal = ({ isOpen, onClose }) => {
    const [attributes, setAttributes] = useState([{ key: '', value: '' }]);

    const handleAddAttribute = () => {
      setAttributes([...attributes, { key: '', value: '' }]);
    };

    const handleAttributeChange = (index, field, value) => {
      const newAttributes = [...attributes];
      newAttributes[index][field] = value;
      setAttributes(newAttributes);
    };

    const handleRemoveAttribute = (index) => {
      setAttributes(attributes.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Convert attributes array to object
      const attributesObj = {};
      attributes.forEach(attr => {
        if (attr.key && attr.value) {
          attributesObj[attr.key] = attr.value;
        }
      });

      const variantData = {
        ...newVariant,
        variantAttributes: attributesObj
      };

      createVariant(variantData);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create New Variant</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Parent Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Product *
              </label>
              <select
                value={newVariant.parentId}
                onChange={(e) => setNewVariant({...newVariant, parentId: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a parent product...</option>
                {products.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.khalifrexId})
                  </option>
                ))}
              </select>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variant Name *
                </label>
                <input
                  type="text"
                  value={newVariant.name}
                  onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., iPhone 15 Pro - 128GB Blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., APL-IP15-128-BL"
                  required
                />
              </div>
            </div>

            {/* Product Identifiers */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UPC</label>
                <input
                  type="text"
                  value={newVariant.upc}
                  onChange={(e) => setNewVariant({...newVariant, upc: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">EAN</label>
                <input
                  type="text"
                  value={newVariant.ean}
                  onChange={(e) => setNewVariant({...newVariant, ean: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MPN</label>
                <input
                  type="text"
                  value={newVariant.mpn}
                  onChange={(e) => setNewVariant({...newVariant, mpn: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Variant Attributes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Variant Attributes *
                </label>
                <button
                  type="button"
                  onClick={handleAddAttribute}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Attribute
                </button>
              </div>
              <div className="space-y-2">
                {attributes.map((attr, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Attribute name (e.g., Color)"
                      value={attr.key}
                      onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g., Blue)"
                      value={attr.value}
                      onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newVariant.description}
                onChange={(e) => setNewVariant({...newVariant, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Optional variant-specific description"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={newVariant.weight}
                onChange={(e) => setNewVariant({...newVariant, weight: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.5"
              />
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensions
              </label>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={newVariant.dimensions.length}
                  onChange={(e) => setNewVariant({
                    ...newVariant,
                    dimensions: { ...newVariant.dimensions, length: e.target.value }
                  })}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Length"
                />
                <input
                  type="number"
                  step="0.1"
                  value={newVariant.dimensions.width}
                  onChange={(e) => setNewVariant({
                    ...newVariant,
                    dimensions: { ...newVariant.dimensions, width: e.target.value }
                  })}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Width"
                />
                <input
                  type="number"
                  step="0.1"
                  value={newVariant.dimensions.height}
                  onChange={(e) => setNewVariant({
                    ...newVariant,
                    dimensions: { ...newVariant.dimensions, height: e.target.value }
                  })}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Height"
                />
                <select
                  value={newVariant.dimensions.unit}
                  onChange={(e) => setNewVariant({
                    ...newVariant,
                    dimensions: { ...newVariant.dimensions, unit: e.target.value }
                  })}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Variant
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Create Offer Modal
  const CreateOfferModal = ({ isOpen, onClose }) => {
    const handleSubmit = (e) => {
      e.preventDefault();
      createOffer(newOffer);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create New Offer</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Variant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Variant *
              </label>
              <select
                value={newOffer.variantId}
                onChange={(e) => setNewOffer({...newOffer, variantId: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a variant...</option>
                {variants.map(variant => (
                  <option key={variant._id} value={variant._id}>
                    {variant.name} ({variant.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Price and Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newOffer.price}
                  onChange={(e) => setNewOffer({...newOffer, price: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="199.99"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newOffer.stock}
                  onChange={(e) => setNewOffer({...newOffer, stock: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                  required
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition *
              </label>
              <select
                value={newOffer.condition}
                onChange={(e) => setNewOffer({...newOffer, condition: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>

            {/* Seller SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seller SKU
              </label>
              <input
                type="text"
                value={newOffer.sellerSku}
                onChange={(e) => setNewOffer({...newOffer, sellerSku: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Your internal SKU"
              />
            </div>

            {/* Shipping Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Shipping Information</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="freeShipping"
                  checked={newOffer.shippingInfo.freeShipping}
                  onChange={(e) => setNewOffer({
                    ...newOffer,
                    shippingInfo: {
                      ...newOffer.shippingInfo,
                      freeShipping: e.target.checked,
                      shippingCost: e.target.checked ? '' : newOffer.shippingInfo.shippingCost
                    }
                  })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="freeShipping" className="ml-2 text-sm text-gray-700">
                  Free Shipping
                </label>
              </div>

              {!newOffer.shippingInfo.freeShipping && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newOffer.shippingInfo.shippingCost}
                    onChange={(e) => setNewOffer({
                      ...newOffer,
                      shippingInfo: { ...newOffer.shippingInfo, shippingCost: e.target.value }
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="9.99"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Delivery
                </label>
                <input
                  type="text"
                  value={newOffer.shippingInfo.estimatedDelivery}
                  onChange={(e) => setNewOffer({
                    ...newOffer,
                    shippingInfo: { ...newOffer.shippingInfo, estimatedDelivery: e.target.value }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2-3 business days"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Offer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Pagination Component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 border rounded-lg ${
                currentPage === page 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Variants Table Component
  const VariantsTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200 rounded-lg">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Variant Info
            </th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              SKU & Identifiers
            </th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Attributes
            </th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {variants.length === 0 ? (
            <tr>
              <td colSpan="5" className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    Loading variants...
                  </div>
                ) : (
                  'No variants found'
                )}
              </td>
            </tr>
          ) : (
            variants.map(variant => (
              <tr key={variant._id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{variant.name}</div>
                    <div className="text-sm text-gray-500">{variant.parent?.name}</div>
                    {variant.description && (
                      <div className="text-sm text-gray-600 mt-1 truncate max-w-xs">
                        {variant.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">SKU:</span> {variant.sku}</div>
                    {variant.upc && <div><span className="font-medium">UPC:</span> {variant.upc}</div>}
                    {variant.ean && <div><span className="font-medium">EAN:</span> {variant.ean}</div>}
                    {variant.mpn && <div><span className="font-medium">MPN:</span> {variant.mpn}</div>}
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(variant.variantAttributes || {}).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  <button
                    onClick={() => toggleVariantStatus(variant._id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      variant.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {variant.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {/* View variant details */}}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {/* Edit variant */}}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      title="Edit Variant"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Offers Table Component
  const OffersTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200 rounded-lg">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Variant
            </th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Price & Stock
            </th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Condition
            </th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Shipping
            </th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {offers.length === 0 ? (
            <tr>
              <td colSpan="6" className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    Loading offers...
                  </div>
                ) : (
                  'No offers found'
                )}
              </td>
            </tr>
          ) : (
            offers.map(offer => (
              <tr key={offer._id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{offer.variant?.name}</div>
                    <div className="text-sm text-gray-500">{offer.variant?.sku}</div>
                    {offer.sellerSku && (
                      <div className="text-sm text-gray-600">Seller SKU: {offer.sellerSku}</div>
                    )}
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {parseFloat(offer.price).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center">
                      <Box className="w-4 h-4 mr-1" />
                      Stock: {offer.stock}
                    </div>
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    offer.condition === 'new' ? 'bg-green-100 text-green-800' :
                    offer.condition === 'used' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {offer.condition.charAt(0).toUpperCase() + offer.condition.slice(1)}
                  </span>
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  <div className="text-sm">
                    {offer.shippingInfo?.freeShipping ? (
                      <span className="text-green-600 font-medium">Free Shipping</span>
                    ) : (
                      <span>${parseFloat(offer.shippingInfo?.shippingCost || 0).toFixed(2)}</span>
                    )}
                    <div className="text-gray-600">
                      {offer.shippingInfo?.estimatedDelivery}
                    </div>
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  <button
                    onClick={() => toggleOfferStatus(offer._id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      offer.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {offer.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {/* View offer details */}}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {/* Edit offer */}}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      title="Edit Offer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteOffer(offer._id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete Offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Variant & Offer Management</h1>
        <p className="text-gray-600">Manage product variants and their corresponding offers</p>
      </div>

      {/* Alerts */}
      {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
      {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('variants')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'variants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4 inline-block mr-2" />
              Product Variants
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'offers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Tag className="w-4 h-4 inline-block mr-2" />
              Offers
            </button>
          </nav>
        </div>

        {/* Tab Content Header */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => {
                  if (activeTab === 'variants') {
                    fetchVariants(pagination.currentPage, searchTerm);
                  } else {
                    fetchOffers(pagination.currentPage, searchTerm);
                  }
                }}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {activeTab === 'variants' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Variant
                </button>
              )}
              {activeTab === 'offers' && (
                <button
                  onClick={() => setShowCreateOfferModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Offer
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {activeTab === 'variants' ? <VariantsTable /> : <OffersTable />}

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => {
              if (activeTab === 'variants') {
                fetchVariants(page, searchTerm);
              } else {
                fetchOffers(page, searchTerm);
              }
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateVariantModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <CreateOfferModal isOpen={showCreateOfferModal} onClose={() => setShowCreateOfferModal(false)} />
    </div>
  );
};

export default VariantOfferManager;