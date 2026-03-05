package com.ghaith.erp.service;

import com.ghaith.erp.model.Order;
import com.ghaith.erp.model.StoreProduct;
import com.ghaith.erp.repository.OrderRepository;
import com.ghaith.erp.repository.StoreProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreProductRepository productRepository;
    private final OrderRepository orderRepository;

    public List<StoreProduct> getAllProducts() {
        return productRepository.findAll();
    }

    public StoreProduct getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("المنتج غير موجود"));
    }

    @Transactional
    public StoreProduct createProduct(StoreProduct product) {
        return productRepository.save(product);
    }

    @Transactional
    public StoreProduct updateProduct(Long id, StoreProduct productDetails) {
        StoreProduct product = getProductById(id);
        if (productDetails.getName() != null)
            product.setName(productDetails.getName());
        if (productDetails.getDescription() != null)
            product.setDescription(productDetails.getDescription());
        if (productDetails.getCategory() != null)
            product.setCategory(productDetails.getCategory());
        if (productDetails.getPrice() != null)
            product.setPrice(productDetails.getPrice());
        if (productDetails.getStockQuantity() != null)
            product.setStockQuantity(productDetails.getStockQuantity());
        if (productDetails.getImageUrl() != null)
            product.setImageUrl(productDetails.getImageUrl());
        if (productDetails.getSku() != null)
            product.setSku(productDetails.getSku());
        if (productDetails.getStatus() != null)
            product.setStatus(productDetails.getStatus());
        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Order> getOrdersByCustomerId(Long customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional
    public Order createOrder(Order order) {
        if (order.getOrderNumber() == null) {
            order.setOrderNumber("ORD-" + System.currentTimeMillis());
        }
        if (order.getStatus() == null) {
            order.setStatus("pending");
        }
        return orderRepository.save(order);
    }
}
