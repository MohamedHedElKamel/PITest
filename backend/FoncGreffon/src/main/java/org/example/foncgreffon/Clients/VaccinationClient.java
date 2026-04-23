package org.example.foncgreffon.Clients;



import org.example.foncgreffon.DTO.VaccinationDTO;
import org.example.foncgreffon.config.FeignJacksonConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(
        name = "infectionetvaccination",
        url = "http://localhost:8082",   // ← port of InfectionetVaccination
        configuration = FeignJacksonConfig.class   // we'll create this
)
public interface VaccinationClient {

    @GetMapping("/vaccinations")   // endpoint from InfectionetVaccination's VaccinationRestController
    List<VaccinationDTO> getAllVaccinations();
}