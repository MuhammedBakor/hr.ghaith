package com.ghaith.erp.controller;

import com.ghaith.erp.model.Order;
import com.ghaith.erp.model.StoreProduct;
import com.ghaith.erp.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/store")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @GetMapping("/products")
    public ResponseEntity<List<StoreProduct>> getAllProducts() {
        return ResponseEntity.ok(storeService.getAllProducts());
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<StoreProduct> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.getProductById(id));
    }

    @PostMapping("/products")
    public ResponseEntity<StoreProduct> createProduct(@RequestBody StoreProduct product) {
        return ResponseEntity.ok(storeService.createProduct(product));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<StoreProduct> updateProduct(@PathVariable Long id, @RequestBody StoreProduct product) {
        return ResponseEntity.ok(storeService.updateProduct(id, product));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        storeService.deleteProduct(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(storeService.getAllOrders());
    }

    @GetMapping("/orders/customer/{customerId}")
    public ResponseEntity<List<Order>> getOrdersByCustomerId(@PathVariable Long customerId) {
        return ResponseEntity.ok(storeService.getOrdersByCustomerId(customerId));
    }

    @PostMapping("/orders")
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        return ResponseEntity.ok(storeService.createOrder(order));
    }
}
