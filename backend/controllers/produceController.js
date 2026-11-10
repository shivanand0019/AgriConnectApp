const Produce = require('../models/Produce');
const User = require('../models/User');

// @desc    Create produce listing
// @route   POST /api/produce
// @access  Private/Farmer
const createProduce = async (req, res) => {
  try {
    const {
      cropName,
      variety,
      quantity,
      unit,
      expectedPrice,
      minOrderQuantity,
      harvestDate,
      qualityGrade,
      location,
      images,
      description,
    } = req.body;

    const produce = await Produce.create({
      farmer: req.user._id,
      cropName,
      variety,
      quantity: Number(quantity),
      availableQuantity: Number(quantity),
      unit: unit || 'kg',
      expectedPrice: Number(expectedPrice),
      minOrderQuantity: Number(minOrderQuantity) || 100,
      harvestDate: harvestDate || new Date(),
      qualityGrade: qualityGrade || 'Grade A',
      location: location || req.user.location,
      images: images && images.length ? images : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'],
      description,
    });

    const populatedProduce = await Produce.findById(produce._id).populate('farmer', 'name email phone location profileImage');

    res.status(201).json({ success: true, data: populatedProduce });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get produce listings (Marketplace with filters)
// @route   GET /api/produce
// @access  Public
const getProduces = async (req, res) => {
  try {
    const { crop, location, minPrice, maxPrice, quality, minQuantity } = req.query;

    let query = { availableQuantity: { $gt: 0 } };

    if (crop) {
      query.cropName = { $regex: crop, $options: 'i' };
    }

    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.district': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } },
      ];
    }

    if (quality) {
      query.qualityGrade = quality;
    }

    if (minPrice || maxPrice) {
      query.expectedPrice = {};
      if (minPrice) query.expectedPrice.$gte = Number(minPrice);
      if (maxPrice) query.expectedPrice.$lte = Number(maxPrice);
    }

    if (minQuantity) {
      query.availableQuantity.$gte = Number(minQuantity);
    }

    const produces = await Produce.find(query)
      .populate('farmer', 'name email phone location profileImage')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: produces.length, data: produces });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single produce by ID
// @route   GET /api/produce/:id
// @access  Public
const getProduceById = async (req, res) => {
  try {
    const produce = await Produce.findById(req.params.id).populate('farmer', 'name email phone location profileImage');

    if (!produce) {
      return res.status(404).json({ success: false, message: 'Produce listing not found' });
    }

    res.json({ success: true, data: produce });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update produce listing
// @route   PUT /api/produce/:id
// @access  Private/Farmer/Admin
const updateProduce = async (req, res) => {
  try {
    let produce = await Produce.findById(req.params.id);

    if (!produce) {
      return res.status(404).json({ success: false, message: 'Produce listing not found' });
    }

    if (produce.farmer.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this listing' });
    }

    produce = await Produce.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('farmer', 'name email phone location profileImage');

    res.json({ success: true, data: produce });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete produce listing
// @route   DELETE /api/produce/:id
// @access  Private/Farmer/Admin
const deleteProduce = async (req, res) => {
  try {
    const produce = await Produce.findById(req.params.id);

    if (!produce) {
      return res.status(404).json({ success: false, message: 'Produce listing not found' });
    }

    if (produce.farmer.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing' });
    }

    await produce.deleteOne();

    res.json({ success: true, message: 'Produce listing removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProduce,
  getProduces,
  getProduceById,
  updateProduce,
  deleteProduce,
};
