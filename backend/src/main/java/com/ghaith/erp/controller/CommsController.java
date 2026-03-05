package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/comms")
@CrossOrigin(origins = "*")
public class CommsController {

    @GetMapping("/correspondences")
    public ResponseEntity<?> getCorrespondences() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/correspondences/stats")
    public ResponseEntity<?> getCorrespondenceStats() {
        return ResponseEntity.ok(new HashMap<>());
    }
}
