package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/official-letters")
@CrossOrigin(origins = "*")
public class OfficialLettersApiController {

    @GetMapping("/letterhead")
    public ResponseEntity<?> getLetterhead() {
        return ResponseEntity.ok(new HashMap<>());
    }

    @GetMapping("/branch-letterhead")
    public ResponseEntity<?> getBranchLetterhead() {
        return ResponseEntity.ok(new HashMap<>());
    }
}
