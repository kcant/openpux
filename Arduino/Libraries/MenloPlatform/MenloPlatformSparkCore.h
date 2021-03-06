
/*
 * Copyright (C) 2015 Menlo Park Innovation LLC
 *
 * This is licensed software, all rights as to the software
 * is reserved by Menlo Park Innovation LLC.
 *
 * A license included with the distribution provides certain limited
 * rights to a given distribution of the work.
 *
 * This distribution includes a copy of the license agreement and must be
 * provided along with any further distribution or copy thereof.
 *
 * If this license is missing, or you wish to license under different
 * terms please contact:
 *
 * menloparkinnovation.com
 * menloparkinnovation@gmail.com
 */


/*
 *  Date: 05/09/2015
 *
 *  Platform support for ARM Processors.
 *
 */

#ifndef MenloPlatformSparkCore_h
#define MenloPlatformSparkCore_h

// SparkCore is now Particle Core, Particle Photon, Particle Electron
#if MENLO_BOARD_SPARKCORE

//
// SparkCore provides its Arduino compatible library
// through application.h
//
// It does not have an "Arduino.h"
//
#include "application.h"

#endif

#endif // MenloPlatformSparkCore_h
