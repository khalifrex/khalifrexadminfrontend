'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    image: '',
    imageFile: null,
    attributes: []
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await axios.get('http://localhost:3092/admin/categories', { withCredentials: true });
    setCategories(res.data);
  };

  const handleAttributeChange = (index, field, value) => {
    const updated = [...form.attributes];
    updated[index][field] = value;
    setForm({ ...form, attributes: updated });
  };

  const addAttribute = () => {
    setForm({
      ...form,
      attributes: [...form.attributes, { name: '', type: 'string', required: false, options: [] }]
    });
  };

  const removeAttribute = (index) => {
    const updated = [...form.attributes];
    updated.splice(index, 1);
    setForm({ ...form, attributes: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('name', form.name);
    data.append('slug', form.slug);
    if (form.imageFile) data.append('image', form.imageFile);
    data.append('attributes', JSON.stringify(form.attributes));

    if (editingCategory) {
      await axios.put(`http://localhost:3092/admin/update/category/${editingCategory._id}`, data, { withCredentials: true });
    } else {
      await axios.post('http://localhost:3092/admin/create/category', data, { withCredentials: true });
    }

    setForm({ name: '', slug: '', image: '', imageFile: null, attributes: [] });
    setEditingCategory(null);
    fetchCategories();
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      image: category.image || '',
      imageFile: null,
      attributes: category.attributes || []
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">{editingCategory ? 'Edit Category' : 'Create Category'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-xl p-6 rounded-2xl border border-gray-200">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Name"
            className="border border-gray-300 p-3 rounded-lg w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Slug"
            className="border border-gray-300 p-3 rounded-lg w-full"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block font-medium text-gray-700 mb-2">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, imageFile: e.target.files[0] })}
          />
          {form.image && (
            <div className="relative mt-3 w-24 h-24 border rounded overflow-hidden">
              <Image
              src={form.image}
              alt="Preview"
              width={96}
              height={96}
              className="object-cover"
              priority
            />

            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Attributes</h2>
          {form.attributes.map((attr, index) => (
            <div key={index} className="grid md:grid-cols-4 gap-3 items-center border p-4 rounded-xl bg-gray-50 mb-3">
              <input
                type="text"
                placeholder="Attribute Name"
                className="border p-2 rounded-lg"
                value={attr.name}
                onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                required
              />
              <select
                className="border p-2 rounded-lg"
                value={attr.type}
                onChange={(e) => handleAttributeChange(index, 'type', e.target.value)}
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="enum">Enum</option>
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={attr.required}
                  onChange={(e) => handleAttributeChange(index, 'required', e.target.checked)}
                />
                <span className="text-sm">Required</span>
              </label>
              <button
                type="button"
                className="text-red-600 hover:text-red-800 text-sm"
                onClick={() => removeAttribute(index)}
              >
                Remove
              </button>
              {attr.type === 'enum' && (
                <input
                  type="text"
                  placeholder="Comma-separated options (Red, Blue, Green)"
                  className="border p-2 rounded-lg col-span-full"
                  value={attr.options?.join(',') || ''}
                  onChange={(e) =>
                    handleAttributeChange(index, 'options', e.target.value.split(',').map(opt => opt.trim()))
                  }
                />
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addAttribute}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Attribute
          </button>
        </div>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow"
        >
          {editingCategory ? 'Update Category' : 'Create Category'}
        </button>
      </form>

      <h2 className="text-2xl font-bold mt-12 mb-4 text-gray-800">Existing Categories</h2>
      <ul className="space-y-4">
        {categories.map((cat) => (
          <li key={cat._id} className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 flex justify-between items-center">
            <div>
              <strong className="text-lg text-gray-800">{cat.name}</strong>
              <span className="ml-2 text-sm text-gray-500">({cat.slug})</span>
            </div>
            <button
              onClick={() => handleEdit(cat)}
              className="text-blue-600 hover:underline text-sm"
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}