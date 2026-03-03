package com.ghaith.erp.repository;

import com.ghaith.erp.model.StoreProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreProductRepository extends JpaRepository<StoreProduct, Long> {
    List<StoreProduct> findByCategory(String category);

    List<StoreProduct> findByStatus(String status);
}
